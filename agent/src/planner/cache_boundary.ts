// cache_boundary.ts: Phân chia khối tĩnh cacheable và nén lịch sử chống Context Bloat.
// Xem rules/context_budget.md và Unit 2 AOCE.
import type { HistoryItem, ToolSpec } from '../types.ts';

export interface PartitionedPrompt {
  staticBlock: {
    systemPrompt: string;
    toolManifestText: string;
    cacheControl?: { type: 'ephemeral' };
  };
  dynamicBlock: {
    runId: string;
    caseId: string;
    state: string;
    history: HistoryItem[];
    lastObservation?: string;
  };
}

export function partitionPrompt(opts: {
  systemPrompt: string;
  manifest: ToolSpec[];
  runId: string;
  caseId: string;
  state: string;
  history: HistoryItem[];
  lastObservation?: string;
}): PartitionedPrompt {
  const manifestText = JSON.stringify(opts.manifest, null, 2);
  const compactedHistory = compactHistory(opts.history, 4);

  return {
    staticBlock: {
      systemPrompt: opts.systemPrompt,
      toolManifestText: manifestText,
      cacheControl: { type: 'ephemeral' },
    },
    dynamicBlock: {
      runId: opts.runId,
      caseId: opts.caseId,
      state: opts.state,
      history: compactedHistory,
      lastObservation: opts.lastObservation ? truncateObservation(opts.lastObservation, 6000) : undefined,
    },
  };
}

export function compactHistory(history: HistoryItem[], maxRecent = 4): HistoryItem[] {
  if (history.length <= maxRecent + 2) return [...history];

  const first = history.slice(0, 1);
  const recent = history.slice(-maxRecent);
  const middle = history.slice(1, -maxRecent);

  const summaryText = `[Đã tóm tắt ${middle.length} bước trung gian: ` +
    middle.map((m) => `${m.action.kind === 'tool' ? m.action.tool : m.action.kind}(${m.result?.status ?? 'done'})`).join(', ') + ']';

  const middleSummary: HistoryItem = {
    action: { kind: 'finish', claim: 'pass', reason: summaryText },
    result: { status: 'ok', data: { summary: summaryText } },
  };

  return [...first, middleSummary, ...recent];
}

export function truncateObservation(text: string, maxChars = 6000): string {
  if (text.length <= maxChars) return text;
  const keep = maxChars - 80;
  return text.slice(0, keep) + `\n[...TRUNCATED: còn ${text.length - keep} ký tự đã bị lược bớt để bảo toàn context budget...]`;
}
