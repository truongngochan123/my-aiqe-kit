// Tool giả theo kịch bản (scenarios.json → toolResults). Dùng cho test và `cli demo` khi không chạy site thật.
import type { ToolExecutor, ToolResult, ToolSpec } from '../types.ts';

export function createFakeTools(manifest: ToolSpec[], toolResults: Record<string, ToolResult[]>) {
  const calls: Record<string, number> = {};
  const queues: Record<string, ToolResult[]> = structuredClone(toolResults);
  const tools: Record<string, ToolExecutor> = Object.fromEntries(manifest.map((t) => [t.name, async () => {
    calls[t.name] = (calls[t.name] ?? 0) + 1;
    return queues[t.name]?.shift() ?? { status: 'error', error: 'kịch bản không có kết quả cho tool này' };
  }]));
  return { tools, calls };
}
