// cleanup_owned_record (GHI, cần G1): xóa record DO RUN NÀY TẠO.
// Guard đã kiểm tra: prefix của run + tên có trong createdRecords. Tool kiểm tra thêm ở tầng dữ liệu:
//   1. empNumber lấy từ created.json của chính run (runs/<runId>/a*/created.json). Không có (ví dụ sau OUTCOME_UNKNOWN)
//      thì tra theo tên và chỉ xóa khi có ĐÚNG 1 record khớp chính xác tên + họ cố định.
//   2. Trước khi xóa: record vẫn mang đúng tên. Sau khi xóa: tra lại, còn thấy → lỗi (không coi là đã dọn).
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { ToolExecutor } from '../types.ts';
import { LAST_NAME, type SandboxClient } from './sandbox_client.ts';

export function createdEmpNumbers(runsDir: string, runId: string, recordName: string): number[] {
  const runDir = join(runsDir, runId);
  if (!existsSync(runDir)) return [];
  const out: number[] = [];
  for (const a of readdirSync(runDir).filter((d) => /^a\d+$/.test(d))) {
    const f = join(runDir, a, 'created.json');
    if (!existsSync(f)) continue;
    const c = JSON.parse(readFileSync(f, 'utf8')) as { recordName: string; empNumber: number };
    if (c.recordName === recordName && Number.isInteger(c.empNumber)) out.push(c.empNumber);
  }
  return [...new Set(out)];
}

export function makeCleanupOwnedRecord(client: () => SandboxClient, runsDir: string): ToolExecutor {
  return async (input, ctx) => {
    const recordName = String(input.recordName);
    const live = (await client().findByFirstName(recordName)).filter((e) => e.lastName === LAST_NAME);
    let targets = createdEmpNumbers(runsDir, ctx.runId, recordName);
    if (targets.length === 0) {
      if (live.length > 1) return { status: 'error', error: `Có ${live.length} record trùng tên ${recordName} và run không ghi empNumber: cần người dọn` };
      targets = live.map((e) => e.empNumber);
    }
    const liveIds = new Set(live.map((e) => e.empNumber));
    const toDelete = targets.filter((n) => liveIds.has(n)); // chỉ xóa record còn tồn tại VÀ đúng tên
    for (const n of toDelete) await client().deleteEmployee(n);
    const left = (await client().findByFirstName(recordName)).filter((e) => toDelete.includes(e.empNumber));
    if (left.length) return { status: 'error', error: `Đã gọi xóa nhưng vẫn thấy record ${left.map((e) => e.empNumber).join(', ')}` };
    return { status: 'ok', data: { recordName, deleted: toDelete } };
  };
}
