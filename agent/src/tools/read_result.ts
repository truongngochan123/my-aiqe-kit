// read_result (chỉ đọc): đọc report JSON của Playwright cho một attempt CỦA RUN NÀY.
// passed = có ít nhất 1 test chạy, không test nào fail, không flaky (flaky không được tính là pass).
import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { ToolExecutor } from '../types.ts';

interface PwResult { status: string; errors?: { message?: string }[]; attachments?: { name: string; path?: string }[] }
interface PwSuite { suites?: PwSuite[]; specs?: { title: string; tests: { results: PwResult[] }[] }[] }
interface PwReport { stats?: { expected: number; unexpected: number; flaky: number; skipped: number }; suites?: PwSuite[] }

const ANSI = /\u001b\[[0-9;]*m/g;

export function summarizeReport(report: PwReport, baseDir: string) {
  const st = report.stats ?? { expected: 0, unexpected: 0, flaky: 0, skipped: 0 };
  const failures: string[] = [];
  const traces: string[] = [];
  const walk = (s: PwSuite) => {
    for (const spec of s.specs ?? []) for (const t of spec.tests) for (const r of t.results) {
      for (const e of r.errors ?? []) failures.push(`${spec.title}: ${(e.message ?? '').replace(ANSI, '').split('\n')[0].slice(0, 300)}`);
      for (const a of r.attachments ?? []) if (a.name === 'trace' && a.path) traces.push(relative(baseDir, a.path));
    }
    (s.suites ?? []).forEach(walk);
  };
  (report.suites ?? []).forEach(walk);
  return {
    passed: st.expected > 0 && st.unexpected === 0 && st.flaky === 0,
    stats: st,
    failures,
    traceRefs: traces,
  };
}

export function makeReadResult(runsDir: string): ToolExecutor {
  return async (input, ctx) => {
    const attemptId = String(input.attemptId);
    if (!/^a\d+$/.test(attemptId)) return { status: 'error', error: `attemptId không hợp lệ: ${attemptId}` };
    const file = join(runsDir, ctx.runId, attemptId, 'results.json'); // chỉ trong thư mục của run hiện tại
    if (!existsSync(file)) return { status: 'error', error: `Không có kết quả cho ${ctx.runId}/${attemptId}` };
    const report = JSON.parse(readFileSync(file, 'utf8')) as PwReport;
    return { status: 'ok', data: { attemptId, ...summarizeReport(report, join(runsDir, ctx.runId)) } };
  };
}
