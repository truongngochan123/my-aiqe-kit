// lookup_owned_record (chỉ đọc): tra record do run tạo, khớp CHÍNH XÁC tên (firstName) + họ cố định.
// Dùng sau khi ghi chưa rõ kết quả (OUTCOME_UNKNOWN). Prefix của run đã được guard kiểm tra trước khi gọi.
import type { ToolExecutor } from '../types.ts';
import { LAST_NAME, type SandboxClient } from './sandbox_client.ts';

export function makeLookupOwnedRecord(client: () => SandboxClient): ToolExecutor {
  return async (input) => {
    const recordName = String(input.recordName);
    const rows = (await client().findByFirstName(recordName)).filter((e) => e.lastName === LAST_NAME);
    if (rows.length > 1) return { status: 'error', error: `Có ${rows.length} record trùng tên ${recordName}: cần người kiểm tra` };
    return { status: 'ok', data: { recordName, exists: rows.length === 1, empNumber: rows[0]?.empNumber ?? null } };
  };
}
