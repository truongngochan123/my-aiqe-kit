// Config cho spec của agent. Chỉ được gọi qua tool run_case (biến AIQE_* do tool đặt).
// retries = 0: case có ghi dữ liệu, không tự chạy lại (rules/retry_and_wait.md). workers = 1.
import { defineConfig } from '@playwright/test';
import { join } from 'node:path';

const attemptDir = process.env.AIQE_ATTEMPT_DIR ?? join(process.cwd(), 'runs', '_manual');

export default defineConfig({
  testDir: '.',
  retries: 0,
  workers: 1,
  forbidOnly: true,
  timeout: 90_000,
  outputDir: join(attemptDir, 'test-results'),
  reporter: [['json', { outputFile: join(attemptDir, 'results.json') }]],
  use: {
    baseURL: process.env.AIQE_BASE_URL,
    channel: process.env.AIQE_BROWSER_CHANNEL || undefined,
    trace: 'on',
    screenshot: 'only-on-failure',
  },
});
