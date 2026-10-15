// Ghép 6 tool thật theo tool_manifest.json. Một client sandbox dùng chung cho cả run (CLI đóng khi xong).
import type { ToolExecutor, ToolSpec } from '../types.ts';
import { PlaywrightSandboxClient, type SandboxClient } from './sandbox_client.ts';
import { makeReadCase } from './read_case.ts';
import { makeInspectUi } from './inspect_ui.ts';
import { makeRunCase, type Runner } from './run_case.ts';
import { makeReadResult } from './read_result.ts';
import { makeLookupOwnedRecord } from './lookup_owned_record.ts';
import { makeCleanupOwnedRecord } from './cleanup_owned_record.ts';

export type RealToolName = 'read_case' | 'inspect_ui' | 'run_case' | 'read_result' | 'lookup_owned_record' | 'cleanup_owned_record';
export interface RealTools { tools: Record<RealToolName, ToolExecutor>; close(): Promise<void> }

export function createRealTools(opts: { env: string; casesDir: string; runsDir: string; manifest: ToolSpec[]; client?: SandboxClient; runner?: Runner; catalog?: string[] }): RealTools {
  let c: SandboxClient | undefined = opts.client;
  const client = () => (c ??= new PlaywrightSandboxClient(opts.env));
  const timeout = (name: string) => opts.manifest.find((t) => t.name === name)?.timeoutMs ?? 30000;
  return {
    tools: {
      read_case: makeReadCase(opts.casesDir, opts.catalog),
      inspect_ui: makeInspectUi(client),
      run_case: makeRunCase({ casesDir: opts.casesDir, runsDir: opts.runsDir, timeoutMs: timeout('run_case'), runner: opts.runner, catalog: opts.catalog }),
      read_result: makeReadResult(opts.runsDir),
      lookup_owned_record: makeLookupOwnedRecord(client),
      cleanup_owned_record: makeCleanupOwnedRecord(client, opts.runsDir),
    },
    close: async () => { await c?.close(); },
  };
}
