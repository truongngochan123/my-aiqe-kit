// read_case (chỉ đọc): trả nội dung case từ agent/cases/<caseId>/case.json. caseId đã qua allowlist trong manifest.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ToolExecutor } from '../types.ts';

export function makeReadCase(casesDir: string): ToolExecutor {
  return async (input) => {
    const caseId = String(input.caseId);
    if (!/^[A-Z0-9-]+$/.test(caseId)) return { status: 'error', error: `caseId không hợp lệ: ${caseId}` };
    const file = join(casesDir, caseId, 'case.json');
    if (!existsSync(file)) return { status: 'error', error: `Không có case ${caseId}` };
    const c = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
    return { status: 'ok', data: { id: c.id, title: c.title, source: c.source, preconditions: c.preconditions, steps: c.steps, oracle: c.oracle } };
  };
}
