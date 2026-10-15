// run_case (GHI, cần G1): chạy spec của case bằng Playwright trong một process riêng.
// Mỗi lần gọi là một attempt mới: runs/<runId>/a<N>/. Không tự chạy lại (retry là việc của người, G2).
//
// Spec ghi 2 file để tool biết đã ghi tới đâu:
//   save-clicked.json : sắp bấm Save (từ đây record CÓ THỂ đã được tạo)
//   created.json      : đã thấy trang chi tiết nhân viên, kèm empNumber
// Kết luận:
//   có created.json                        → ok, created: true
//   không có save-clicked.json             → ok, created: false (chưa ghi gì; test fail)
//   có save-clicked.json, không có created → unknown (OUTCOME_UNKNOWN: chỉ được tra cứu, không chạy lại)
//   process quá thời gian                  → timeout (xử lý như unknown)
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import type { ToolExecutor } from '../types.ts';

export interface RunnerResult { exitCode: number | null; timedOut: boolean }
export type Runner = (args: { specFile: string; configFile: string; env: Record<string, string> }, timeoutMs: number) => Promise<RunnerResult>;

export const playwrightRunner: Runner = ({ specFile, configFile, env }, timeoutMs) => new Promise((resolve) => {
  const cli = createRequire(import.meta.url).resolve('@playwright/test/cli');
  const child = spawn(process.execPath, [cli, 'test', specFile, '--config', configFile], { env: { ...process.env, ...env }, stdio: 'ignore' });
  const timer = setTimeout(() => { child.kill(); resolve({ exitCode: null, timedOut: true }); }, timeoutMs);
  child.on('exit', (code) => { clearTimeout(timer); resolve({ exitCode: code, timedOut: false }); });
  child.on('error', () => { clearTimeout(timer); resolve({ exitCode: null, timedOut: false }); });
});

export function nextAttemptId(runDir: string): string {
  const used = existsSync(runDir) ? readdirSync(runDir).filter((d) => /^a\d+$/.test(d)).map((d) => Number(d.slice(1))) : [];
  return `a${used.length ? Math.max(...used) + 1 : 1}`;
}

export function makeRunCase(opts: { casesDir: string; runsDir: string; timeoutMs: number; runner?: Runner; catalog?: string[] }): ToolExecutor {
  const runner = opts.runner ?? playwrightRunner;
  return async (input, ctx) => {
    const caseId = String(input.caseId);
    if (opts.catalog && !opts.catalog.includes(caseId)) return { status: 'error', error: `Case "${caseId}" không có trong flow catalog` };
    const recordName = String(input.recordName);
    const runDir = join(opts.runsDir, ctx.runId);
    const attemptId = nextAttemptId(runDir);
    const attemptDir = join(runDir, attemptId);
    mkdirSync(attemptDir, { recursive: true });

    const specFile = join(opts.casesDir, caseId, `${caseId.toLowerCase().replace(/-\d+$/, '')}.spec.ts`);
    if (!existsSync(specFile)) return { status: 'error', error: `Không có spec cho ${caseId}` };

    // Dừng sớm hơn timeout của controller 5 giây để kịp kill process (không để process chạy ngầm).
    const r = await runner({
      specFile,
      configFile: join(opts.casesDir, 'playwright.config.ts'),
      env: { AIQE_BASE_URL: ctx.env, AIQE_RECORD_NAME: recordName, AIQE_ATTEMPT_DIR: attemptDir },
    }, Math.max(1000, opts.timeoutMs - 5000));

    const created = join(attemptDir, 'created.json');
    const base = { recordName, attemptId, exitCode: r.exitCode };
    if (existsSync(created)) {
      const c = JSON.parse(readFileSync(created, 'utf8')) as { recordName: string; empNumber: number };
      if (c.recordName !== recordName) return { status: 'unknown', error: 'created.json không khớp recordName', data: base };
      return { status: 'ok', data: { ...base, created: true } };
    }
    if (r.timedOut) return { status: 'timeout', error: 'Spec chạy quá thời gian', data: base };
    if (existsSync(join(attemptDir, 'save-clicked.json'))) {
      return { status: 'unknown', error: 'Đã bấm Save nhưng không xác nhận được record đã tạo', data: base };
    }
    return { status: 'ok', data: { ...base, created: false } };
  };
}
