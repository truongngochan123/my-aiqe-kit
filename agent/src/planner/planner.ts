// Chọn planner theo chế độ. Planner nào cũng chỉ ĐỀ XUẤT hành động; controller quyết định.
import type { Action, Planner } from '../types.ts';
import { MockPlanner } from './mock_planner.ts';
import { CodexPlanner } from './codex_planner.ts';
import { ApiPlanner } from './api_planner.ts';

export type PlannerMode = 'mock' | 'codex' | 'api';

export function createPlanner(mode: PlannerMode, opts: { steps?: Action[]; tools?: string[] } = {}): Planner {
  switch (mode) {
    case 'mock': return new MockPlanner(opts.steps ?? []);
    case 'codex': return new CodexPlanner(opts.tools ?? []);
    case 'api': return new ApiPlanner();
    default: throw new Error(`Chế độ planner không hỗ trợ: ${String(mode)}`);
  }
}
