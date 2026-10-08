import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

// Tài khoản test và URL đọc từ .env.sandbox (không commit). Mẫu: .env.sandbox.example.
// Không hardcode credential; không hỏi credential qua chat (rules/automation_standards.md).
if (existsSync('.env.sandbox')) process.loadEnvFile('.env.sandbox');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  // Chặn test.only lọt lên CI.
  forbidOnly: !!process.env.CI,
  // Retry chỉ trên CI. Test pass ở lần retry hiện là "flaky" trong report, lần fail đầu vẫn giữ trace.
  // Không tăng retry để che lỗi (rules/retry_and_wait.md).
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Service worker có thể gửi request vòng qua context.route → chặn.
    serviceWorkers: 'block',
    // Mặc định headless. Debug trên máy: npx playwright test --headed
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
