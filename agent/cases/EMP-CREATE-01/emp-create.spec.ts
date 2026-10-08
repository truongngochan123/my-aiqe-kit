// EMP-CREATE-01: tạo nhân viên và tra lại đúng record. Chạy qua tool run_case (cần G1), không chạy tay trên site dùng chung.
// Ghi save-clicked.json TRƯỚC khi bấm Save và created.json SAU khi thấy empNumber: tool dựa vào 2 file này
// để phân biệt "chưa ghi gì" / "đã tạo" / "không rõ" (OUTCOME_UNKNOWN). Xem src/tools/run_case.ts.
import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const recordName = process.env.AIQE_RECORD_NAME ?? '';
const attemptDir = process.env.AIQE_ATTEMPT_DIR ?? '';
const user = process.env.AIQE_SANDBOX_USER ?? '';
const pass = process.env.AIQE_SANDBOX_PASS ?? '';
const LAST_NAME = 'Auto';

test('EMP-CREATE-01 tạo nhân viên và tra lại đúng record', async ({ page, context, baseURL }) => {
  expect(recordName, 'thiếu AIQE_RECORD_NAME').toMatch(/^[A-Z]{2,6}-r\d{3}-[A-Za-z0-9-]+$/);
  expect(user && pass, 'thiếu tài khoản sandbox').toBeTruthy();
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', (route) => (new URL(route.request().url()).origin === origin ? route.continue() : route.abort()));

  await page.goto('/web/index.php/auth/login');
  await page.getByPlaceholder('Username').fill(user);
  await page.getByPlaceholder('Password').fill(pass);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(/\/dashboard/);

  await page.goto('/web/index.php/pim/addEmployee');
  await expect(page.getByRole('heading', { name: 'Add Employee' })).toBeVisible();
  await page.locator('input[name="firstName"]').fill(recordName);
  await page.locator('input[name="lastName"]').fill(LAST_NAME);

  writeFileSync(join(attemptDir, 'save-clicked.json'), JSON.stringify({ recordName, at: new Date().toISOString() }));
  await page.getByRole('button', { name: 'Save' }).click();

  // Oracle phần 1: chuyển sang trang chi tiết của nhân viên mới.
  await page.waitForURL(/\/pim\/viewPersonalDetails\/empNumber\/\d+/);
  const empNumber = Number(/empNumber\/(\d+)/.exec(page.url())![1]);
  writeFileSync(join(attemptDir, 'created.json'), JSON.stringify({ recordName, empNumber }));

  // Oracle phần 2: tra theo tên thấy đúng 1 record vừa tạo.
  const q = new URLSearchParams({ nameOrId: recordName, includeEmployees: 'onlyCurrent', limit: '50', offset: '0' });
  const r = await page.request.get(`/web/index.php/api/v2/pim/employees?${q}`);
  expect(r.status()).toBe(200);
  const rows = ((await r.json()) as { data: { empNumber: number; firstName: string; lastName: string }[] }).data
    .filter((e) => e.firstName === recordName);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ empNumber, firstName: recordName, lastName: LAST_NAME });
});
