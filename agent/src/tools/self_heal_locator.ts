// self_heal_locator.ts: Đề xuất locator thay thế bền vững khi UI thay đổi (Unit 6 AOCE).
// Chỉ ĐỀ XUẤT (AI-PROPOSAL), không tự ý sửa test code và không sửa assertion.
import type { ToolExecutor } from '../types.ts';

export interface SelfHealInput {
  oldSelector: string;
  tagName?: string;
  text?: string;
  role?: string;
  testId?: string;
}

export function generateProposedLocator(input: SelfHealInput): { selector: string; confidence: 'high' | 'medium' | 'low'; reason: string } {
  // Ưu tiên theo Playwright locator best practices: getByRole > getByTestId > getByLabel/Text > scoped CSS
  if (input.role && input.text) {
    return {
      selector: `page.getByRole('${input.role}', { name: '${input.text}' })`,
      confidence: 'high',
      reason: 'Định vị theo role ngữ nghĩa và accessible name (bền vững nhất trước thay đổi CSS)',
    };
  }
  if (input.testId) {
    return {
      selector: `page.getByTestId('${input.testId}')`,
      confidence: 'high',
      reason: 'Định vị theo data-testid chuyên dụng cho kiểm thử',
    };
  }
  if (input.text) {
    return {
      selector: `page.getByText('${input.text}', { exact: true })`,
      confidence: 'medium',
      reason: 'Định vị theo text hiển thị chính xác',
    };
  }
  if (input.tagName) {
    return {
      selector: `page.locator('${input.tagName}').filter(...)`,
      confidence: 'low',
      reason: 'Định vị theo thẻ HTML kết hợp bộ lọc ngữ cảnh',
    };
  }
  return {
    selector: input.oldSelector,
    confidence: 'low',
    reason: 'Không đủ thông tin ngữ nghĩa; giữ nguyên locator cũ',
  };
}

export function makeSelfHealLocator(): ToolExecutor {
  return async (input) => {
    const oldSelector = String(input.oldSelector || '');
    const tagName = input.tagName ? String(input.tagName) : undefined;
    const text = input.text ? String(input.text) : undefined;
    const role = input.role ? String(input.role) : undefined;
    const testId = input.testId ? String(input.testId) : undefined;

    if (!oldSelector) {
      return { status: 'error', error: 'Thiếu oldSelector để đề xuất self-healing' };
    }

    const proposal = generateProposedLocator({ oldSelector, tagName, text, role, testId });
    const diff = `-${oldSelector}\n+${proposal.selector}`;

    return {
      status: 'ok',
      data: {
        oldSelector,
        proposedSelector: proposal.selector,
        confidence: proposal.confidence,
        reason: proposal.reason,
        diff,
        status: 'AI-PROPOSAL',
        note: 'Đề xuất self-healing locator cần QA lead hoặc người bảo trì test duyệt (G3 nếu có thay đổi trong test suite)',
      },
    };
  };
}
