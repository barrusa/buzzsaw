const { performance } = require('perf_hooks');

const players = [];
for (let i = 1; i <= 8; i++) {
  players.push({ id: i, name: `Player ${i}`, devicePath: null });
}

const target = 8;

// Find approach
const startFind = performance.now();
for (let i = 0; i < 10_000_000; i++) {
  players.find(p => p.id === target);
}
const endFind = performance.now();

// Map approach
const map = new Map(players.map(p => [p.id, p]));
const startMap = performance.now();
for (let i = 0; i < 10_000_000; i++) {
  map.get(target);
}
const endMap = performance.now();

console.log(`Find: ${endFind - startFind}ms`);
console.log(`Map: ${endMap - startMap}ms`);
