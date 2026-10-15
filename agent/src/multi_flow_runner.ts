// multi_flow_runner.ts: Điều phối chuỗi liên hoàn nhiều flow (Unit 3 AOCE).
// Đảm bảo tính cách ly dữ liệu (Data Isolation) và dừng khẩn cấp (Fail-Fast).
import type { RunRequest, RunSummary } from './types.ts';
import { type FlowCatalog } from './catalog.ts';

export interface SequenceConfig {
  name: string;
  description?: string;
  enabled?: boolean;
  flows: string[];
}

export interface MultiFlowResult {
  sequenceName: string;
  totalFlows: number;
  passed: number;
  failed: number;
  blocked: number;
  flowSummaries: RunSummary[];
  allPassed: boolean;
  reason: string;
}

export class MultiFlowRunner {
  readonly #catalog: FlowCatalog & { sequences?: SequenceConfig[] };

  constructor(catalog: FlowCatalog & { sequences?: SequenceConfig[] }) {
    this.#catalog = catalog;
  }

  getSequence(name: string): SequenceConfig | undefined {
    return (this.#catalog.sequences || []).find((s) => s.name === name);
  }

  async runSequence(opts: {
    sequenceName: string;
    baseRunId: string;
    env: string;
    dataPrefix: string;
    oracle: RunRequest['oracle'];
    simulated?: boolean;
    executeFlow: (req: RunRequest) => Promise<RunSummary>;
  }): Promise<MultiFlowResult> {
    const seq = this.getSequence(opts.sequenceName);
    if (!seq) {
      return {
        sequenceName: opts.sequenceName,
        totalFlows: 0,
        passed: 0,
        failed: 0,
        blocked: 0,
        flowSummaries: [],
        allPassed: false,
        reason: `Không tìm thấy chuỗi flow "${opts.sequenceName}" trong catalog`,
      };
    }

    const summaries: RunSummary[] = [];
    let passed = 0;
    let failed = 0;
    let blocked = 0;

    for (let i = 0; i < seq.flows.length; i++) {
      const caseId = seq.flows[i];
      const stepRunId = `${opts.baseRunId}-s${i + 1}`;
      const stepPrefix = `${opts.dataPrefix}-s${i + 1}`;

      const req: RunRequest = {
        runId: stepRunId,
        caseId,
        env: opts.env,
        dataPrefix: stepPrefix,
        oracle: opts.oracle,
        simulated: opts.simulated,
      };

      const summary = await opts.executeFlow(req);
      summaries.push(summary);

      if (summary.verdict === 'pass') {
        passed++;
      } else if (summary.verdict === 'fail') {
        failed++;
        // Fail-Fast: Dừng chuỗi ngay khi 1 flow lỗi để cách ly dữ liệu
        return {
          sequenceName: opts.sequenceName,
          totalFlows: seq.flows.length,
          passed,
          failed,
          blocked,
          flowSummaries: summaries,
          allPassed: false,
          reason: `Chuỗi dừng sớm tại flow ${caseId} (${stepRunId}) do kết quả fail`,
        };
      } else {
        blocked++;
        return {
          sequenceName: opts.sequenceName,
          totalFlows: seq.flows.length,
          passed,
          failed,
          blocked,
          flowSummaries: summaries,
          allPassed: false,
          reason: `Chuỗi dừng sớm tại flow ${caseId} (${stepRunId}) do bị chặn hoặc không kết luận (${summary.state})`,
        };
      }
    }

    return {
      sequenceName: opts.sequenceName,
      totalFlows: seq.flows.length,
      passed,
      failed,
      blocked,
      flowSummaries: summaries,
      allPassed: passed === seq.flows.length,
      reason: 'Chuỗi hoàn tất toàn bộ các flow',
    };
  }
}
