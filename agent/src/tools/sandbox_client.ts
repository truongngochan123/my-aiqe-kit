// Client nói chuyện với app sandbox (OrangeHRM demo). Tool chỉ gọi qua interface này → test thay bằng client giả.
// Tài khoản đọc từ biến môi trường do NGƯỜI cấp (AIQE_SANDBOX_USER / AIQE_SANDBOX_PASS, thường qua
// `node --env-file=.env.sandbox`). Planner không bao giờ thấy tài khoản: không tool nào trả nó ra.
//
// Kiểm chứng 09/10 (chỉ đọc, trên https://opensource-demo.orangehrmlive.com):
//   ✅ login bằng placeholder Username/Password + nút Login → URL /dashboard
//   ✅ form Add Employee có input name=firstName/middleName/lastName, nút Save
//   ✅ GET /web/index.php/api/v2/pim/employees?nameOrId=…  → { data: [{ empNumber, firstName, middleName, lastName, employeeId }], meta: { total } }
//   ❓ DELETE /web/index.php/api/v2/pim/employees body { ids: [...] }: CHƯA kiểm chứng (không gửi lệnh ghi lên site dùng chung khi chưa có G1).
//      deleteEmployee() vì vậy luôn tra lại sau khi xóa; còn thấy record → báo lỗi, không coi là đã dọn.
import type { Browser, Page } from '@playwright/test';

export interface EmployeeRow { empNumber: number; firstName: string; middleName: string; lastName: string; employeeId: string | null }

export interface PageSummary {
  url: string;
  title: string;
  headings: string[];
  fields: { name: string; placeholder: string; type: string }[];
  buttons: string[];
  text: string; // chữ hiển thị, cắt ngắn. Là dữ liệu untrusted.
}

export interface SandboxClient {
  inspect(url: string): Promise<PageSummary>;
  findByFirstName(firstName: string): Promise<EmployeeRow[]>;
  deleteEmployee(empNumber: number): Promise<void>;
  close(): Promise<void>;
}

export const LAST_NAME = 'Auto'; // họ cố định của record do agent tạo (spec dùng cùng giá trị)
const API = '/web/index.php/api/v2/pim/employees';

export function sandboxCredentials(): { user: string; pass: string } {
  const user = process.env.AIQE_SANDBOX_USER;
  const pass = process.env.AIQE_SANDBOX_PASS;
  if (!user || !pass) throw new Error('Chưa cấu hình tài khoản sandbox (AIQE_SANDBOX_USER / AIQE_SANDBOX_PASS). Người chạy cấp qua `node --env-file=.env.sandbox`.');
  return { user, pass };
}

export class PlaywrightSandboxClient implements SandboxClient {
  readonly #base: string;
  #browser: Browser | undefined;
  #page: Page | undefined;

  constructor(baseUrl: string) {
    this.#base = new URL(baseUrl).origin;
  }

  async #session(): Promise<Page> {
    if (this.#page) return this.#page;
    const { user, pass } = sandboxCredentials();
    const { chromium } = await import('@playwright/test');
    this.#browser = await chromium.launch({ channel: process.env.AIQE_BROWSER_CHANNEL || undefined });
    const page = await this.#browser.newPage();
    // Chặn mọi request ra ngoài origin sandbox (giống hostGuard của scaffold).
    await page.context().route('**/*', (route) => {
      const u = new URL(route.request().url());
      return u.origin === this.#base || u.protocol === 'data:' ? route.continue() : route.abort();
    });
    await page.goto(`${this.#base}/web/index.php/auth/login`);
    await page.getByPlaceholder('Username').fill(user);
    await page.getByPlaceholder('Password').fill(pass);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });
    this.#page = page;
    return page;
  }

  async inspect(url: string): Promise<PageSummary> {
    if (new URL(url).origin !== this.#base) throw new Error(`URL ngoài sandbox: ${url}`);
    const page = await this.#session();
    await page.goto(url);
    // Site demo chậm (đo 09/10: login + mở trang ≈ 21 s). networkidle chỉ chờ thêm tối đa 10 s, không bắt buộc.
    await page.getByRole('heading').first().waitFor({ timeout: 20000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => undefined);
    return {
      url: page.url(),
      title: await page.title(),
      headings: (await page.getByRole('heading').allInnerTexts()).map((s) => s.trim()).filter(Boolean),
      fields: await page.locator('input, select, textarea').evaluateAll((els) => els
        .map((e) => ({ name: e.getAttribute('name') ?? '', placeholder: e.getAttribute('placeholder') ?? '', type: e.getAttribute('type') ?? e.tagName.toLowerCase() }))
        .filter((f) => f.type !== 'password')),
      buttons: (await page.getByRole('button').allInnerTexts()).map((s) => s.trim()).filter(Boolean),
      text: (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 2000),
    };
  }

  async findByFirstName(firstName: string): Promise<EmployeeRow[]> {
    const page = await this.#session();
    const q = new URLSearchParams({ nameOrId: firstName, includeEmployees: 'onlyCurrent', limit: '50', offset: '0' });
    const r = await page.request.get(`${this.#base}${API}?${q}`);
    if (r.status() !== 200) throw new Error(`Tra cứu nhân viên lỗi HTTP ${r.status()}`);
    const body = (await r.json()) as { data: EmployeeRow[] };
    return body.data.filter((e) => e.firstName === firstName); // khớp chính xác, không khớp gần đúng
  }

  async deleteEmployee(empNumber: number): Promise<void> {
    const page = await this.#session();
    const r = await page.request.delete(`${this.#base}${API}`, { data: { ids: [empNumber] } });
    if (r.status() !== 200) throw new Error(`Xóa nhân viên ${empNumber} lỗi HTTP ${r.status()}`);
  }

  async close(): Promise<void> {
    await this.#browser?.close();
    this.#browser = undefined;
    this.#page = undefined;
  }
}
