const earlyBuzzers = Array.from({length: 10000}, (_, i) => i);
const buzzQueue = Array.from({length: 10000}, (_, i) => ({ player: i * 2, label: 'x' }));

console.time('baseline');
for (let i = 0; i < 100; i++) {
  earlyBuzzers.filter(pid => !buzzQueue.some(b => b.player === pid));
}
console.timeEnd('baseline');

console.time('optimized');
for (let i = 0; i < 100; i++) {
  const buzzQueueSet = new Set(buzzQueue.map(b => b.player));
  earlyBuzzers.filter(pid => !buzzQueueSet.has(pid));
}
console.timeEnd('optimized');
