// Báo cáo một run từ evidence JSONL. Chỉ đọc evidence, không tin lời planner:
// kết luận lấy từ bản ghi run_end do controller ghi, nhãn theo rules/evidence_labels.md.
//   pass → LOCAL-RUN: passed · fail → LOCAL-RUN: failed · inconclusive → UNKNOWN (không có nhãn run)
// Không bao giờ ghi RUN-PASSED/RUN-FAILED: cần SHA đã review trên server, agent chạy local không có.
// Dữ liệu từ tool (chữ trên trang, lỗi) là untrusted: báo cáo chỉ tóm tắt trạng thái, không dán nguyên văn.
import type { EvidenceRecord } from './evidence_store.ts';
import type { RunSummary } from './types.ts';

const cell = (v: unknown) => String(v ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').slice(0, 160);

// Run mô phỏng (tool giả) không chạy gì thật → không được nhãn run nào.
export function runLabel(verdict: RunSummary['verdict'] | undefined, simulated = false): string {
  if (simulated) return `MÔ PHỎNG, không phải run thật: ${verdict === 'pass' ? 'pass' : verdict === 'fail' ? 'fail' : 'không kết luận'}`;
  if (verdict === 'pass') return 'LOCAL-RUN: passed';
  if (verdict === 'fail') return 'LOCAL-RUN: failed';
  return 'UNKNOWN';
}

function describe(r: EvidenceRecord): string {
  const d = r.data as Record<string, any>;
  switch (r.type) {
    case 'run_start': return `case ${d.caseId}, planner ${d.planner}, oracle ${d.oracle?.id}`;
    case 'proposal': return d.kind === 'tool' ? `đề xuất ${d.tool}: ${d.reason}` : `đề xuất ${d.kind}${d.claim ? ` (${d.claim})` : ''}: ${d.reason ?? d.question ?? ''}`;
    case 'blocked': return `CHẶN ${d.guard?.code}: ${d.guard?.reason}`;
    case 'approval': return `${d.gate ?? ''} ${d.decision}${d.approver ? ` bởi ${d.approver}` : ''}`;
    case 'tool_call': return `gọi ${d.tool} (${d.state})`;
    case 'tool_result': return `${d.tool} → ${d.result?.status}${d.result?.error ? `: ${d.result.error}` : ''}`;
    case 'security_observation': return `${d.tool}: dữ liệu có mẫu giống chỉ thị (${(d.patterns ?? []).length} mẫu)`;
    case 'stop_reason': return `${d.code}: ${d.reason}`;
    case 'run_end': return `${d.state} · ${d.verdict}`;
    case 'run_rejected': return `${d.code}: ${d.reason}`;
    default: return '';
  }
}

function nextSteps(end: RunSummary | undefined, toolProblems: string[] = []): string[] {
  if (!end) return ['Run chưa có `run_end` (bị ngắt giữa chừng). Kiểm tra dữ liệu do run tạo trên sandbox trước khi chạy run mới.'];
  const s: string[] = [];
  for (const p of toolProblems) s.push(`Tool lỗi: ${p}. Xem nguyên nhân (mạng, tài khoản sandbox, timeout trong tool_manifest) trước khi chạy run mới.`);
  if (end.createdRecords.length) s.push(`Người dọn tay record còn lại: ${end.createdRecords.join(', ')} (rồi ghi lại vào evidence/ghi chú).`);
  if (end.state === 'BLOCKED_NEEDS_HUMAN') s.push('Người kiểm tra trên sandbox: record đã được tạo chưa. Muốn tạo lại → G2, dùng run ID mới.');
  if (end.state === 'BLOCKED') s.push('Đọc lý do bị chặn ở trên. Sửa kịch bản/approval rồi chạy run ID mới; không sửa policy hay guard để cho qua.');
  if (end.securityObservations.length) s.push('Có dữ liệu giống chỉ thị trên trang: báo QA lead, xem lại nguồn dữ liệu (`incident-triage`).');
  if (end.verdict === 'fail') s.push('Triage lần fail (`incident-triage`) trước khi kết luận bug; mở trace trong `runs/<runId>/a*/`.');
  if (end.verdict === 'pass') s.push('Kết quả chỉ là `LOCAL-RUN: passed` trên sandbox. Muốn dùng làm bằng chứng phát hành → chạy trong CI trên SHA đã review.');
  return s.length ? s : ['Không có việc tồn.'];
}

export function formatUsage(usage: RunSummary['usage'] | undefined): string {
  if (!usage || usage === 'UNKNOWN') return 'UNKNOWN';
  if (typeof usage === 'string') return usage;
  const parts: string[] = [];
  if (usage.totalTokens !== undefined) parts.push(`total_tokens: ${usage.totalTokens}`);
  if (usage.promptTokens !== undefined) parts.push(`prompt_tokens: ${usage.promptTokens}`);
  if (usage.completionTokens !== undefined) parts.push(`completion_tokens: ${usage.completionTokens}`);
  if (usage.plannerCalls !== undefined) parts.push(`planner_calls: ${usage.plannerCalls}`);
  return parts.length ? parts.join(', ') : 'UNKNOWN';
}

export function buildReport(all: EvidenceRecord[], runId: string, chain: { ok: boolean; brokenAt?: number; reason?: string }): string {
  const recs = all.filter((r) => r.runId === runId);
  if (!recs.length) return `# Báo cáo run ${runId}\n\nKhông có bản ghi nào cho run này.\n`;
  const start = recs.find((r) => r.type === 'run_start')?.data as Record<string, any> | undefined;
  const end = recs.find((r) => r.type === 'run_end')?.data as RunSummary | undefined;
  const label = runLabel(end?.verdict, start?.simulated === true);
  const kitVer = end?.kitVersion ?? start?.kitVersion ?? 'UNKNOWN';
  const promptVer = end?.promptVersion ?? start?.promptVersion ?? 'UNKNOWN';
  const usageStr = formatUsage(end?.usage);
  const out: string[] = [];
  out.push('---', 'produced_by: aiqe-agent', `run_id: ${runId}`, `case: ${start?.caseId ?? 'UNKNOWN'}`, `env: ${start?.env ?? 'UNKNOWN'}`,
    `planner: ${start?.planner ?? 'UNKNOWN'}`, `kit_version: ${kitVer}`, `prompt_version: ${promptVer}`, `usage: ${usageStr}`, `result: "${label}"`, '---', '');
  out.push(`# Báo cáo run ${runId}`, '');
  out.push(`**Kết quả:** \`${label}\`${end ? ` · trạng thái \`${end.state}\` · ${end.toolCalls} lần gọi tool` : ''}`);
  out.push(`**Phiên bản:** kit \`${kitVer}\` · prompt \`${promptVer}\` · **Usage:** \`${usageStr}\``);
  out.push(`**Lý do:** ${end?.reason ?? 'Run chưa kết thúc (không có run_end)'}`);
  out.push(`**Chuỗi evidence:** ${chain.ok ? 'nguyên vẹn (hash khớp)' : `BỊ HỎNG tại bản ghi ${chain.brokenAt}: ${chain.reason}. Không dùng báo cáo này làm bằng chứng.`}`);
  if (start) out.push(`**Oracle:** \`${start.oracle?.id}\`, hash \`${String(start.oracleHash).slice(0, 12)}…\` (bất biến trong run; đổi cần G3 + run mới)`);
  out.push('');

  const approvals = recs.filter((r) => r.type === 'approval').map((r) => r.data as Record<string, any>);
  out.push('## Duyệt (gate)', '');
  if (approvals.length) {
    out.push('| Gate | Quyết định | Người duyệt | Hết hạn |', '|---|---|---|---|');
    for (const a of approvals) out.push(`| ${cell(a.gate)} | ${cell(a.decision)} | ${cell(a.approver ?? '')} | ${cell(a.expiresAt ?? '')} |`);
  } else out.push('Không có hành động cần duyệt.');
  out.push('');

  const blocked = recs.filter((r) => r.type === 'blocked').map((r) => r.data as Record<string, any>);
  out.push('## Hành động bị chặn', '');
  if (blocked.length) {
    out.push('| Đề xuất | Mã | Lý do |', '|---|---|---|');
    for (const b of blocked) out.push(`| ${cell(b.action?.tool ?? b.action?.kind)} | ${cell(b.guard?.code)} | ${cell(b.guard?.reason)} |`);
  } else out.push('Không có.');
  out.push('');

  out.push('## Dữ liệu do run tạo', '');
  out.push(`- Còn lại chưa dọn: ${end?.createdRecords.length ? end.createdRecords.join(', ') : 'không'}`);
  out.push(`- Quan sát bảo mật: ${end?.securityObservations.length ? end.securityObservations.length : 'không'}`);
  out.push('');

  out.push('## Diễn biến', '', '| # | Loại | Nội dung |', '|---|---|---|');
  for (const r of recs) out.push(`| ${r.seq} | ${r.type} | ${cell(describe(r))} |`);
  out.push('');

  out.push('## Bước tiếp theo', '');
  const toolProblems = recs.filter((r) => r.type === 'tool_result' && (r.data as any).result?.status !== 'ok')
    .map((r) => { const d = r.data as any; return `${d.tool} → ${d.result?.status}${d.result?.error ? ` (${cell(d.result.error)})` : ''}`; });
  for (const s of nextSteps(end, toolProblems)) out.push(`- ${s}`);
  out.push('');
  return out.join('\n');
}
