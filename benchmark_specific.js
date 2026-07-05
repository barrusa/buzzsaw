const { performance } = require('perf_hooks');

const N = 10000;
const buzzQueue = Array.from({ length: N }, (_, i) => ({ player: i, label: 'buzz' }));
const playerId = N - 1; // Worst case

const startOld = performance.now();
for(let i=0; i<10000; i++) {
  buzzQueue.some(b => b.player === playerId);
}
const endOld = performance.now();
const oldTime = endOld - startOld;

const buzzedPlayers = new Set(buzzQueue.map(b => b.player));
const startNew = performance.now();
for(let i=0; i<10000; i++) {
  buzzedPlayers.has(playerId);
}
const endNew = performance.now();
const newTime = endNew - startNew;

console.log(`Array.some: ${oldTime.toFixed(2)}ms`);
console.log(`Set.has: ${newTime.toFixed(2)}ms`);
console.log(`Improvement: ${(oldTime / newTime).toFixed(2)}x faster`);
