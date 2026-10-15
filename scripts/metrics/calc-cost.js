#!/usr/bin/env node
// calc-cost.js: Tính toán chi phí USD từ token usage dựa trên model_pricing.json.
// Chạy: node calc-cost.js --tokens 1500,300 --model claude-3-5-sonnet
//       node calc-cost.js --self-test
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const PRICING_FILE = join(ROOT, 'agent/config/model_pricing.json');

export function loadPricing() {
  if (existsSync(PRICING_FILE)) {
    try {
      return JSON.parse(readFileSync(PRICING_FILE, 'utf8')).models;
    } catch {
      // fallback
    }
  }
  return {
    'gpt-4o': { promptPerMillion: 2.5, completionPerMillion: 10.0, cachedPromptPerMillion: 1.25 },
    'claude-3-5-sonnet': { promptPerMillion: 3.0, completionPerMillion: 15.0, cachedPromptPerMillion: 0.3 },
    'gemini-1.5-flash': { promptPerMillion: 0.075, completionPerMillion: 0.3, cachedPromptPerMillion: 0.01875 },
    'mock': { promptPerMillion: 0.0, completionPerMillion: 0.0, cachedPromptPerMillion: 0.0 },
  };
}

export function calculateCost(opts) {
  const { model = 'claude-3-5-sonnet', promptTokens = 0, completionTokens = 0, cachedTokens = 0 } = opts;
  const pricing = loadPricing();
  const p = pricing[model] || pricing['claude-3-5-sonnet'];

  const nonCachedPrompt = Math.max(0, promptTokens - cachedTokens);
  const promptCost = (nonCachedPrompt / 1_000_000) * p.promptPerMillion;
  const cachedCost = (cachedTokens / 1_000_000) * (p.cachedPromptPerMillion || p.promptPerMillion);
  const completionCost = (completionTokens / 1_000_000) * p.completionPerMillion;
  const totalCost = promptCost + cachedCost + completionCost;

  return {
    model,
    promptTokens,
    cachedTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    promptCostUsd: Number(promptCost.toFixed(6)),
    completionCostUsd: Number(completionCost.toFixed(6)),
    totalCostUsd: Number(totalCost.toFixed(6)),
    formattedTotal: `$${totalCost < 0.01 ? totalCost.toFixed(6) : totalCost.toFixed(4)} USD`,
  };
}

function selfTest() {
  console.log('=== Self-test calc-cost.js ===');
  const res1 = calculateCost({ model: 'gpt-4o', promptTokens: 1000, completionTokens: 500 });
  // prompt: 1000 / 1M * 2.5 = 0.0025. completion: 500 / 1M * 10 = 0.005. total = 0.0075
  if (Math.abs(res1.totalCostUsd - 0.0075) > 0.00001) {
    console.error(`FAIL: gpt-4o cost expected 0.0075, got ${res1.totalCostUsd}`);
    process.exit(1);
  }
  console.log('PASS: gpt-4o token calculation');

  const res2 = calculateCost({ model: 'claude-3-5-sonnet', promptTokens: 10000, cachedTokens: 8000, completionTokens: 1000 });
  // non-cached: 2000 * 3 / 1M = 0.006. cached: 8000 * 0.3 / 1M = 0.0024. comp: 1000 * 15 / 1M = 0.015. total = 0.0234
  if (Math.abs(res2.totalCostUsd - 0.0234) > 0.00001) {
    console.error(`FAIL: claude cached prompt expected 0.0234, got ${res2.totalCostUsd}`);
    process.exit(1);
  }
  console.log('PASS: claude prompt caching cost');

  console.log('calc-cost self-test: 2/2 đạt.');
  process.exit(0);
}

// CLI entry point
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args.includes('--self-test')) {
    selfTest();
  } else {
    let tokens = [0, 0];
    let model = 'claude-3-5-sonnet';
    let cached = 0;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--tokens' && args[i + 1]) {
        tokens = args[++i].split(',').map((x) => Number(x.trim()) || 0);
      } else if (args[i] === '--model' && args[i + 1]) {
        model = args[++i];
      } else if (args[i] === '--cached' && args[i + 1]) {
        cached = Number(args[++i]) || 0;
      }
    }
    const result = calculateCost({ model, promptTokens: tokens[0] || 0, completionTokens: tokens[1] || 0, cachedTokens: cached });
    console.log(JSON.stringify(result, null, 2));
  }
}
