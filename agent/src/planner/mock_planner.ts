// Planner giả lập: trả lần lượt các hành động viết sẵn trong kịch bản (agent/scenarios/scenarios.json).
// Dùng cho test và demo khi chưa có LLM. Không cần API key.
import type { Action, Planner, PlannerInput } from '../types.ts';

export class MockPlanner implements Planner {
  readonly name = 'mock';
  readonly #steps: Action[];
  #i = 0;

  constructor(steps: Action[]) {
    this.#steps = steps;
  }

  async next(_input: PlannerInput): Promise<Action> {
    const step = this.#steps[this.#i++];
    return step ?? { kind: 'finish', claim: 'fail', reason: 'Kịch bản mock đã hết bước' };
  }
}
