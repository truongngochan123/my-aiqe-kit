// Dữ liệu từ tool (trang web, log, trace) là UNTRUSTED: bọc lại trước khi đưa planner, và dò chỉ thị lạ.
// Hàng threat: chống sai sót. Regex chỉ bắt được mẫu phổ biến (docs/agent_design.md mục 7).

const INJECTION_PATTERNS: RegExp[] = [
  /ignore (all |any )?(previous|prior|above) (instructions|rules|policies)/i,
  /disregard (all |any )?(previous|prior|above|your) (instructions|rules|policies)/i,
  /bỏ qua (mọi|tất cả|các) (hướng dẫn|quy tắc|chỉ dẫn)/i,
  /(upload|send|post|exfiltrate)\b.{0,40}\b(to|tới|lên)\s+https?:\/\//i,
  /\bsystem prompt\b/i,
  /\b(run|execute) (this |the following )?(command|shell|script)\b/i,
  /you are now\b|from now on you\b/i,
];

export function detectInjection(text: string): string[] {
  return INJECTION_PATTERNS.filter((re) => re.test(text)).map((re) => re.source);
}

// Bọc dữ liệu: planner được dặn coi nội dung trong thẻ là DỮ LIỆU, không phải lệnh.
export function wrapUntrusted(source: string, data: unknown): string {
  const body = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const safe = body.replace(/<\/?untrusted[^>]*>/gi, '[thẻ untrusted đã bị loại]');
  return `<untrusted source="${source}">\n${safe}\n</untrusted>`;
}
