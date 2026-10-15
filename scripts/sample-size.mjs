// Sample size per variant for a two-proportion z-test (two-sided α = 0.05, power 0.8), for the A/B cards in
// docs/readme-drafts/ab-tests.md. Baselines 4–6 % come from decisions §13 / data/benchmarks.md, not from skill tables.
// Run: node scripts/sample-size.mjs
import assert from 'node:assert/strict';

const Z_ALPHA = 1.959964; // two-sided 0.05
const Z_BETA = 0.841621; // power 0.80

export function perVariant(p1, relLift) {
  const p2 = p1 * (1 + relLift);
  const pBar = (p1 + p2) / 2;
  const a = Z_ALPHA * Math.sqrt(2 * pBar * (1 - pBar));
  const b = Z_BETA * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2));
  return Math.ceil(((a + b) / (p2 - p1)) ** 2);
}

// Self-check, computed by hand: 5 % → 6 %: p̄ = 0.055; 1.959964·√0.10395 = 0.63191; 0.841621·√0.1039 = 0.27129;
// (0.90320 / 0.01)² = 8157.7 → 8158.
assert.equal(perVariant(0.05, 0.2), 8158);

const DAILY = 300; // assumption: link clicks per day across both variants (README states it as an assumption)
console.log(`n per variant (α 0.05 two-sided, power 0.8); days at ${DAILY} visits/day split 50/50`);
console.log('baseline  MDE(rel)  n/variant  days');
for (const lift of [0.2, 0.3, 0.5]) for (const p of [0.04, 0.05, 0.06]) {
  const n = perVariant(p, lift);
  console.log(`${(p * 100).toFixed(0).padStart(6)} %  ${(lift * 100).toFixed(0).padStart(6)} %  ${String(n).padStart(9)}  ${String(Math.ceil((2 * n) / DAILY)).padStart(4)}`);
}
