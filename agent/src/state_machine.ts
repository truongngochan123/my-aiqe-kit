// Trạng thái của một run và các chuyển trạng thái hợp lệ (docs/agent_design.md mục 3).
import type { State } from './types.ts';

// Mọi trạng thái đang chạy đều dừng được về BLOCKED / BLOCKED_NEEDS_HUMAN / CLEANUP_PENDING (dừng an toàn).
const STOP: State[] = ['BLOCKED', 'BLOCKED_NEEDS_HUMAN', 'CLEANUP_PENDING'];
const TRANSITIONS: Record<State, State[]> = {
  PLANNED: ['AWAIT_G1', 'SETUP', 'ACT', 'VERIFY', 'CLEANUP', 'DONE', 'CANCELLED', 'FAILED', ...STOP],
  AWAIT_G1: ['SETUP', 'ACT', 'CLEANUP', 'CANCELLED', ...STOP],
  SETUP: ['ACT', 'VERIFY', 'CLEANUP', 'OUTCOME_UNKNOWN', 'AWAIT_G1', 'FAILED', ...STOP],
  ACT: ['VERIFY', 'CLEANUP', 'OUTCOME_UNKNOWN', 'AWAIT_G1', 'FAILED', ...STOP],
  OUTCOME_UNKNOWN: ['VERIFY', 'CLEANUP', 'AWAIT_G1', ...STOP],
  VERIFY: ['CLEANUP', 'DONE', 'AWAIT_G1', 'FAILED', ...STOP],
  CLEANUP: ['DONE', 'AWAIT_G1', ...STOP],
  // Trạng thái kết thúc: không đi đâu nữa.
  DONE: [],
  CLEANUP_PENDING: [],
  BLOCKED: [],
  BLOCKED_NEEDS_HUMAN: [],
  CANCELLED: [],
  FAILED: [],
};

export const TERMINAL: ReadonlySet<State> = new Set(
  (Object.keys(TRANSITIONS) as State[]).filter((s) => TRANSITIONS[s].length === 0),
);

export function canTransition(from: State, to: State): boolean {
  return from === to || TRANSITIONS[from].includes(to);
}

// Chuyển trạng thái; chuyển sai là lỗi lập trình → ném lỗi, không âm thầm bỏ qua.
export function transition(from: State, to: State): State {
  if (!canTransition(from, to)) throw new Error(`Chuyển trạng thái không hợp lệ: ${from} → ${to}`);
  return to;
}
