// Evidence chỉ ghi thêm (append-only) dạng JSONL, mỗi bản ghi chứa hash của bản ghi trước.
// Không có hàm sửa hay xóa. verify() tính lại chuỗi hash để phát hiện bản ghi bị sửa/xóa/chèn.
// Giới hạn: xóa cả file thì không còn gì để so (docs/agent_design.md mục 7).
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';

export interface EvidenceRecord {
  seq: number;
  ts: string;
  runId: string;
  type: string;
  data: unknown;
  prevHash: string;
  hash: string;
}

const GENESIS = '0'.repeat(64);

function hashOf(r: Omit<EvidenceRecord, 'hash'>): string {
  return createHash('sha256').update(JSON.stringify([r.seq, r.ts, r.runId, r.type, r.data, r.prevHash])).digest('hex');
}

export class EvidenceStore {
  readonly file: string;
  #last: { seq: number; hash: string };

  constructor(file: string) {
    this.file = file;
    mkdirSync(dirname(file), { recursive: true });
    const all = this.readAll();
    const last = all[all.length - 1];
    this.#last = last ? { seq: last.seq, hash: last.hash } : { seq: 0, hash: GENESIS };
  }

  append(runId: string, type: string, data: unknown): EvidenceRecord {
    const base = { seq: this.#last.seq + 1, ts: new Date().toISOString(), runId, type, data, prevHash: this.#last.hash };
    const rec: EvidenceRecord = { ...base, hash: hashOf(base) };
    appendFileSync(this.file, JSON.stringify(rec) + '\n', { encoding: 'utf8', flag: 'a' });
    this.#last = { seq: rec.seq, hash: rec.hash };
    return rec;
  }

  readAll(): EvidenceRecord[] {
    if (!existsSync(this.file)) return [];
    return readFileSync(this.file, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l) as EvidenceRecord);
  }

  // Kiểm tra chuỗi: seq liên tục, prevHash khớp, hash tính lại khớp.
  verify(): { ok: boolean; brokenAt?: number; reason?: string } {
    let prev = GENESIS;
    let seq = 0;
    for (const r of this.readAll()) {
      seq++;
      if (r.seq !== seq) return { ok: false, brokenAt: r.seq, reason: `seq nhảy từ ${seq - 1} sang ${r.seq} (bản ghi bị xóa hoặc chèn)` };
      if (r.prevHash !== prev) return { ok: false, brokenAt: r.seq, reason: 'prevHash không khớp bản ghi trước' };
      const { hash, ...rest } = r;
      if (hashOf(rest) !== hash) return { ok: false, brokenAt: r.seq, reason: 'nội dung bản ghi đã bị sửa' };
      prev = hash;
    }
    return { ok: true };
  }

  usedRunIds(): Set<string> {
    return new Set(this.readAll().filter((r) => r.type === 'run_start').map((r) => r.runId));
  }
}
