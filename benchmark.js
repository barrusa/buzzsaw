const { performance } = require('perf_hooks');

const N = 10000;
const M = 10000;

const earlyBuzzers = Array.from({ length: N }, (_, i) => i);
const buzzQueue = Array.from({ length: M }, (_, i) => ({ player: i + N/2, label: 'buzz' }));

console.log(`Measuring with N=${N} earlyBuzzers and M=${M} buzzQueue items...`);

// Baseline (Old approach) O(N*M)
const startOld = performance.now();
const resultOld = earlyBuzzers.filter(pid => !buzzQueue.some(b => b.player === pid));
const endOld = performance.now();
const oldTime = endOld - startOld;

// Optimized (New approach) O(N)
const startNew = performance.now();
const buzzedPlayerIds = new Set(buzzQueue.map(b => b.player));
const resultNew = earlyBuzzers.filter(pid => !buzzedPlayerIds.has(pid));
const endNew = performance.now();
const newTime = endNew - startNew;

console.log(`Baseline (O(N*M)): ${oldTime.toFixed(2)}ms`);
console.log(`Optimized (O(N)): ${newTime.toFixed(2)}ms`);
console.log(`Improvement: ${(oldTime / newTime).toFixed(2)}x faster`);

// Verify correctness
console.assert(resultOld.length === resultNew.length, "Results don't match!");
console.assert(resultOld.every((v, i) => v === resultNew[i]), "Results don't match!");
