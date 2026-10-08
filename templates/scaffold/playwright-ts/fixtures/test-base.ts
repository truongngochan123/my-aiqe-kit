import { test as base, expect } from '@playwright/test';

// Fixture dùng chung cho mọi test. Import `test` từ file này, KHÔNG import thẳng từ '@playwright/test'.
//
// hostGuard (tự chạy): chặn request từ trang tới host KHÔNG nằm trong allowlist
// (host của BASE_URL + ALLOWED_HOSTS). Request bị chặn được ghi vào annotation của test.
// Hàng threat: CHỐNG SAI SÓT (docs/threat_model.md). Giới hạn đã biết:
//  - không áp dụng cho APIRequestContext (fixture `request`, request.newContext)
//  - không áp dụng cho browser/context tự tạo trong test (chromium.launch)
//  - xóa fixture này là hết chặn → chốt thật là review PR và sandbox mạng ở tầng hệ điều hành

function allowedHosts(): Set<string> {
  const hosts = new Set<string>();
  if (process.env.BASE_URL) hosts.add(new URL(process.env.BASE_URL).host);
  for (const h of (process.env.ALLOWED_HOSTS || '').split(',').map((s) => s.trim()).filter(Boolean)) hosts.add(h);
  return hosts;
}

type Fixtures = { hostGuard: void; runPrefix: string };

export const test = base.extend<Fixtures>({
  hostGuard: [
    async ({ context }, use, testInfo) => {
      if (!process.env.BASE_URL) {
        throw new Error('Thiếu BASE_URL. Chép .env.sandbox.example thành .env.sandbox và điền URL sandbox.');
      }
      const allow = allowedHosts();
      const blocked = new Set<string>();
      await context.route('**/*', async (route) => {
        const url = route.request().url();
        if (!/^https?:/.test(url)) return route.continue();
        const host = new URL(url).host;
        if (allow.has(host)) return route.continue();
        blocked.add(host);
        return route.abort('blockedbyclient');
      });
      await use();
      for (const h of blocked) testInfo.annotations.push({ type: 'blocked-host', description: h });
    },
    { auto: true },
  ],

  // Prefix cho data của lần chạy (QA-r001…), dùng để đặt tên record và dọn đúng dữ liệu của mình.
  runPrefix: async ({}, use) => {
    await use(process.env.RUN_PREFIX || 'QA-r001');
  },
});

export { expect };
