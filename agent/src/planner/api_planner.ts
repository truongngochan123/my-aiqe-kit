// Chỗ cắm planner gọi LLM qua API key (Anthropic, OpenAI…). Chưa triển khai (08/10).
// Key đọc từ biến môi trường của TERMINAL người dùng (AIQE_PLANNER_API_KEY), không đặt trong repo/.env của dự án.
import type { Action, Planner, PlannerInput } from '../types.ts';

export class ApiPlanner implements Planner {
  readonly name = 'api';

  async next(_input: PlannerInput): Promise<Action> {
    if (!process.env.AIQE_PLANNER_API_KEY) {
      return { kind: 'ask_human', question: 'Planner api chưa cấu hình (thiếu AIQE_PLANNER_API_KEY). Dùng planner mock hoặc codex.' };
    }
    return { kind: 'ask_human', question: 'Planner api chưa được triển khai trong 0.2.0.' };
  }
}
