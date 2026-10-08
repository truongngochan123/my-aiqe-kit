import type { Page, Response } from '@playwright/test';

// Page Object gốc. Page class chỉ chứa LOCATOR và HÀNH ĐỘNG; assertion nằm trong test.
// Locator phải lấy từ DOM thật (DOM-OBSERVED), có scope (trong dialog, row, form),
// theo thứ tự ưu tiên ở rules/automation_standards.md và skills/ui-automation/references/playwright-ts.md.
export class BasePage {
  constructor(protected readonly page: Page) {}

  async open(path = '/'): Promise<Response | null> {
    return this.page.goto(path);
  }
}
