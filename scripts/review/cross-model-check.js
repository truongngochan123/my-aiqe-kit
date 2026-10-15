#!/usr/bin/env node
// cross-model-check.js: Đối chiếu kết quả review giữa 2 model AI độc lập (Unit 4 AOCE).
// Chạy: node cross-model-check.js --self-test
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function compareReviews(reviewA, reviewB) {
  const disagreements = [];
  const consensus = [];

  // 1. So sánh phán quyết tổng thể
  const verdictA = reviewA.verdict; // 'accept' | 'reject' | 'modify'
  const verdictB = reviewB.verdict;

  const sameVerdict = verdictA === verdictB;

  // 2. So sánh từng tiêu chí cụ thể
  const keys = ['oracleValid', 'priorityMatch', 'safeAssertion', 'partitionComplete'];
  for (const k of keys) {
    const valA = reviewA.checks?.[k];
    const valB = reviewB.checks?.[k];
    if (valA !== undefined && valB !== undefined) {
      if (valA === valB) {
        consensus.push({ key: k, agreedValue: valA });
      } else {
        disagreements.push({ key: k, modelA: valA, modelB: valB });
      }
    }
  }

  let finalDecision = 'CONSENSUS_ACCEPTED';
  if (!sameVerdict || disagreements.length > 0) {
    finalDecision = 'DISAGREEMENT_NEEDS_HUMAN';
  } else if (verdictA === 'reject') {
    finalDecision = 'CONSENSUS_REJECTED';
  }

  return {
    modelA: reviewA.model || 'model-a',
    modelB: reviewB.model || 'model-b',
    finalDecision,
    isConsensus: sameVerdict && disagreements.length === 0,
    disagreements,
    consensus,
  };
}

function selfTest() {
  console.log('=== Self-test cross-model-check.js ===');
  const a1 = { model: 'claude-3-5', verdict: 'accept', checks: { oracleValid: true, priorityMatch: true } };
  const b1 = { model: 'gpt-4o', verdict: 'accept', checks: { oracleValid: true, priorityMatch: true } };
  const res1 = compareReviews(a1, b1);
  if (res1.finalDecision !== 'CONSENSUS_ACCEPTED' || !res1.isConsensus) {
    console.error('FAIL: Đồng thuận hoàn toàn phải trả về CONSENSUS_ACCEPTED');
    process.exit(1);
  }
  console.log('PASS: Trường hợp đồng thuận (Consensus)');

  const a2 = { model: 'claude-3-5', verdict: 'accept', checks: { oracleValid: true, priorityMatch: true } };
  const b2 = { model: 'gpt-4o', verdict: 'reject', checks: { oracleValid: false, priorityMatch: true } };
  const res2 = compareReviews(a2, b2);
  if (res2.finalDecision !== 'DISAGREEMENT_NEEDS_HUMAN' || res2.disagreements.length !== 1) {
    console.error('FAIL: Bất đồng phải trả về DISAGREEMENT_NEEDS_HUMAN');
    process.exit(1);
  }
  console.log('PASS: Trường hợp bất đồng (Disagreement detected)');

  console.log('cross-model-check self-test: 2/2 đạt.');
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args.includes('--self-test')) {
    selfTest();
  } else {
    console.log('Dùng: node cross-model-check.js --self-test');
  }
}
