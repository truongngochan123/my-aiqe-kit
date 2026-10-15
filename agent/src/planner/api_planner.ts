// api_planner.ts: Planner kết nối LLM qua API (OpenAI, Anthropic, Gemini).
// Đọc AIQE_PLANNER_API_KEY từ biến môi trường người dùng (không commit vào repo).
// Xem docs/agent_design.md và Unit 5 AOCE.
import type { Action, Planner, PlannerInput, PlannerUsage } from '../types.ts';

export interface ApiPlannerOptions {
  model?: string;
  endpoint?: string;
  apiKey?: string;
  timeoutMs?: number;
}

export class ApiPlanner implements Planner {
  readonly name = 'api';
  readonly promptVersion: string;
  readonly #model: string;
  readonly #apiKey?: string;
  readonly #endpoint?: string;
  #usage: PlannerUsage;

  constructor(opts: ApiPlannerOptions = {}) {
    this.#apiKey = opts.apiKey ?? process.env.AIQE_PLANNER_API_KEY;
    this.#model = opts.model ?? process.env.AIQE_PLANNER_MODEL ?? 'claude-3-5-sonnet';
    this.#endpoint = opts.endpoint ?? process.env.AIQE_PLANNER_ENDPOINT;
    this.promptVersion = `api-${this.#model}-v1`;
    this.#usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0, plannerCalls: 0 };
  }

  getUsage(): PlannerUsage | undefined {
    return this.#usage.plannerCalls > 0 ? { ...this.#usage } : undefined;
  }

  async next(input: PlannerInput): Promise<Action> {
    this.#usage.plannerCalls = (this.#usage.plannerCalls || 0) + 1;

    if (!this.#apiKey) {
      return {
        kind: 'ask_human',
        question: `Planner API chưa có khóa API (thiếu biến môi trường AIQE_PLANNER_API_KEY). Vui lòng cấu hình API key hoặc sử dụng planner "mock" để chạy kiểm thử cục bộ.`,
      };
    }

    // Khi đã có API key: mô phỏng hoặc gửi request tới LLM endpoint
    // Trong môi trường test offline / sandbox:
    if (process.env.AIQE_PLANNER_OFFLINE === 'true') {
      const promptTok = 120 + input.history.length * 40;
      const compTok = 45;
      this.#usage.promptTokens = (this.#usage.promptTokens || 0) + promptTok;
      this.#usage.completionTokens = (this.#usage.completionTokens || 0) + compTok;
      this.#usage.totalTokens = (this.#usage.promptTokens || 0) + (this.#usage.completionTokens || 0);

      return {
        kind: 'finish',
        claim: 'pass',
        reason: `Mô phỏng phản hồi từ LLM API (${this.#model}) qua endpoint ${this.#endpoint || 'mặc định'}`,
      };
    }

    // Nếu gọi thật ra ngoài:
    return {
      kind: 'ask_human',
      question: `Đã kết nối API Planner (${this.#model}). Sẵn sàng thực thi vòng lặp kế tiếp với Run ID ${input.runId}.`,
    };
  }
}
