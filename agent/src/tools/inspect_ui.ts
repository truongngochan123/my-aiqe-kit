// inspect_ui (chỉ đọc): tóm tắt trang trên sandbox. Không click, không gõ vào form.
// Output là dữ liệu untrusted: controller bọc <untrusted> và dò chỉ thị lạ trước khi đưa planner.
import type { ToolExecutor } from '../types.ts';
import type { SandboxClient } from './sandbox_client.ts';

// scope → đường dẫn trang tương ứng. URL không khớp scope thì từ chối (planner không dùng scope để mở trang khác).
const SCOPE_PATH: Record<string, RegExp> = {
  login: /\/auth\/login$/,
  'employee-list': /\/pim\/viewEmployeeList$/,
  'add-employee': /\/pim\/addEmployee$/,
};

export function makeInspectUi(client: () => SandboxClient): ToolExecutor {
  return async (input, ctx) => {
    const url = String(input.url);
    if (new URL(url).origin !== new URL(ctx.env).origin) return { status: 'error', error: 'URL khác env của run' };
    const scope = input.scope === undefined ? undefined : String(input.scope);
    if (scope && !SCOPE_PATH[scope]?.test(new URL(url).pathname)) return { status: 'error', error: `URL không khớp scope "${scope}"` };
    const s = await client().inspect(url);
    return { status: 'ok', data: { ...s } };
  };
}
