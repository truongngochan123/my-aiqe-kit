// Kiểu dữ liệu dùng chung của agent. Xem docs/agent_design.md.

export type Gate = 'G1' | 'G2' | 'G3' | 'G4';

export type State =
  | 'PLANNED' | 'AWAIT_G1' | 'SETUP' | 'ACT' | 'VERIFY' | 'CLEANUP'
  | 'OUTCOME_UNKNOWN'
  | 'DONE' | 'CLEANUP_PENDING' | 'BLOCKED' | 'BLOCKED_NEEDS_HUMAN' | 'CANCELLED' | 'FAILED';

export type ToolMode = 'read' | 'write';
export type Phase = 'inspect' | 'setup' | 'act' | 'verify' | 'lookup' | 'cleanup';

export interface InputRule {
  type: 'string' | 'number' | 'boolean';
  required?: boolean;
  allow?: string[];          // giá trị được phép
  url?: boolean;             // phải thuộc sandboxUrls
  owned?: boolean;           // phải mang data prefix của run
  createdOnly?: boolean;     // phải là record do run này tạo
}

export interface ToolSpec {
  name: string;
  description: string;
  mode: ToolMode;
  phase: Phase;
  gate?: Gate;
  timeoutMs: number;
  inputs: Record<string, InputRule>;
}

export interface Policy {
  sandboxUrls: string[];
  idPrefix: string;
  runIdPattern: string;
  dataPrefixPattern: string;
  approvalTtlMs: number;
  budget: { maxToolCalls: number; maxBlockedActions: number; maxWallMs: number };
}

export interface OracleSpec {
  id: string;
  expect: Record<string, unknown>;
}

export type Action =
  | { kind: 'tool'; tool: string; input: Record<string, unknown>; reason: string }
  | { kind: 'finish'; claim: 'pass' | 'fail'; reason: string }
  | { kind: 'change_oracle'; oracle: OracleSpec; reason: string }
  | { kind: 'ask_human'; question: string };

export interface ToolResult {
  // unknown: tool đã có thể ghi nhưng không xác nhận được (ví dụ đã bấm Save rồi mất kết quả). Xử lý như timeout.
  status: 'ok' | 'error' | 'timeout' | 'unknown';
  data?: Record<string, unknown>;
  error?: string;
}

export type ToolExecutor = (input: Record<string, unknown>, ctx: { runId: string; env: string; dataPrefix: string }) => Promise<ToolResult>;

export interface ApprovalScope {
  runId: string;
  env: string;
  caseId: string;
  tools: string[];
}

export interface Approval {
  id: string;
  gate: Gate;
  scope: ApprovalScope;
  approver: string;
  at: string;
  expiresAt: string;
}

export interface GuardResult {
  ok: boolean;
  code?: string;
  reason?: string;
}

export interface HistoryItem {
  action: Action;
  result?: ToolResult;
  blocked?: GuardResult;
}

export interface PlannerInput {
  runId: string;
  caseId: string;
  state: State;
  history: HistoryItem[];
  lastObservation?: string; // đã bọc <untrusted>
}

export interface Planner {
  readonly name: string;
  next(input: PlannerInput): Promise<Action>;
}

export interface RunRequest {
  runId: string;
  caseId: string;
  env: string;
  dataPrefix: string;     // ví dụ QA-r001
  oracle: OracleSpec;
  simulated?: boolean;   // tool giả (test/demo): không bao giờ được nhãn LOCAL-RUN
}

export interface RunContext extends RunRequest {
  state: State;
  oracleHash: string;
  toolCalls: number;
  blockedActions: number;
  startedAt: number;
  approvals: Approval[];
  createdRecords: string[];
  writeOutcomeUnknown: boolean;
  verifyPassed: boolean | null;
  cleanupDone: boolean | null;
  securityObservations: string[];
}

export interface RunSummary {
  runId: string;
  state: State;
  verdict: 'pass' | 'fail' | 'inconclusive';
  reason: string;
  toolCalls: number;
  createdRecords: string[];
  securityObservations: string[];
}
