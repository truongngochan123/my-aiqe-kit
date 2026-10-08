// Hỏi người duyệt gate (G1/G2). Planner KHÔNG trả lời thay được: controller gọi trực tiếp provider này.
import { createInterface } from 'node:readline/promises';
import { randomUUID } from 'node:crypto';
import type { Approval, ApprovalScope, Gate } from './types.ts';

export interface ApprovalProvider {
  request(gate: Gate, scope: ApprovalScope, summary: string, ttlMs: number): Promise<Approval | null>;
}

function makeApproval(gate: Gate, scope: ApprovalScope, approver: string, ttlMs: number): Approval {
  const now = Date.now();
  return { id: `APR-${randomUUID().slice(0, 8)}`, gate, scope, approver, at: new Date(now).toISOString(), expiresAt: new Date(now + ttlMs).toISOString() };
}

// Console: hiện phạm vi, người phải gõ đúng "dong y <run ID>". Gõ "ok" hay Enter không được tính.
export class ConsoleApprovals implements ApprovalProvider {
  readonly approver: string;
  constructor(approver: string) { this.approver = approver; }

  async request(gate: Gate, scope: ApprovalScope, summary: string, ttlMs: number): Promise<Approval | null> {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
      console.log(`\n=== ${gate} cần duyệt ===`);
      console.log(`Run: ${scope.runId} · Env: ${scope.env} · Case: ${scope.caseId}`);
      console.log(`Tool: ${scope.tools.join(', ')}`);
      console.log(`Việc: ${summary}`);
      console.log(`Hiệu lực: ${Math.round(ttlMs / 60000)} phút, chỉ cho run này.`);
      const ans = (await rl.question(`Gõ "dong y ${scope.runId}" để đồng ý, Enter để từ chối: `)).trim();
      return ans === `dong y ${scope.runId}` ? makeApproval(gate, scope, this.approver, ttlMs) : null;
    } finally {
      rl.close();
    }
  }
}

// Kịch bản cho test/demo: danh sách quyết định theo thứ tự (true = đồng ý).
export class ScriptedApprovals implements ApprovalProvider {
  readonly decisions: boolean[];
  readonly asked: { gate: Gate; scope: ApprovalScope; summary: string }[] = [];
  constructor(decisions: boolean[]) { this.decisions = [...decisions]; }

  async request(gate: Gate, scope: ApprovalScope, summary: string, ttlMs: number): Promise<Approval | null> {
    this.asked.push({ gate, scope, summary });
    return this.decisions.shift() ? makeApproval(gate, scope, 'scripted', ttlMs) : null;
  }
}
