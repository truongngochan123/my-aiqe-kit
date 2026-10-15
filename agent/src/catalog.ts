// Quản lý flow catalog cho agent.
// Đọc danh mục flow từ flows.json và áp dụng allowlist vào tool manifest.
import { existsSync, readFileSync } from 'node:fs';
import type { ToolSpec } from './types.ts';

export interface FlowItem {
  caseId: string;
  name?: string;
  path?: string;
  enabled?: boolean;
  description?: string;
}

export interface FlowCatalog {
  flows: FlowItem[];
}

export function loadFlowCatalog(catalogPath: string): string[] {
  if (!existsSync(catalogPath)) return ['EMP-CREATE-01'];
  try {
    const raw = JSON.parse(readFileSync(catalogPath, 'utf8')) as FlowCatalog;
    const allowed = (raw.flows || [])
      .filter((f) => f.enabled !== false)
      .map((f) => f.caseId);
    return allowed.length ? allowed : ['EMP-CREATE-01'];
  } catch {
    return ['EMP-CREATE-01'];
  }
}

export function applyCatalogToManifest(manifest: ToolSpec[], allowedCaseIds: string[]): ToolSpec[] {
  return manifest.map((spec) => {
    if (spec.inputs && spec.inputs.caseId) {
      return {
        ...spec,
        inputs: {
          ...spec.inputs,
          caseId: {
            ...spec.inputs.caseId,
            allow: [...allowedCaseIds],
          },
        },
      };
    }
    return spec;
  });
}
