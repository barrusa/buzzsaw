const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'test-config.json');

const config = {
  players: [
    { id: 1, name: "Player 1", devicePath: null },
    { id: 2, name: "Player 2", devicePath: null },
    { id: 3, name: "Player 3", devicePath: null },
  ],
  hostBounds: { x: 0, y: 0, width: 800, height: 600 },
  boardBounds: { x: 0, y: 0, width: 800, height: 600 },
};

const data = JSON.stringify(config, null, 2);

function syncWrite() {
  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    fs.writeFileSync(DATA_PATH, data);
  }
  const end = performance.now();
  return end - start;
}

async function asyncWrite() {
  const start = performance.now();
  let p = Promise.resolve();
  for (let i = 0; i < 1000; i++) {
    p = p.then(() => fs.promises.writeFile(DATA_PATH, data));
  }
  await p;
  const end = performance.now();
  return end - start;
}

async function run() {
  console.log("Measuring sync write time (1000 iterations)...");
  const syncTime = syncWrite();
  console.log(`Sync time: ${syncTime.toFixed(2)} ms`);

  console.log("Measuring async write time (1000 iterations)...");
  const asyncTime = await asyncWrite();
  console.log(`Async time: ${asyncTime.toFixed(2)} ms`);

  // Also check single invocation overhead which might block the main thread

  console.log("Measuring sync blocking time (1000 iterations)...");
  const startSyncBlock = performance.now();
  for (let i = 0; i < 100; i++) {
    const s = performance.now();
    fs.writeFileSync(DATA_PATH, data);
    const e = performance.now();
  }
  const endSyncBlock = performance.now();
  console.log(`Total Sync time for 100 blocking writes: ${(endSyncBlock - startSyncBlock).toFixed(2)} ms`);

  console.log("Measuring async non-blocking time (1000 iterations)...");
  const startAsyncBlock = performance.now();
  let p2 = Promise.resolve();
  for (let i = 0; i < 100; i++) {
    const s = performance.now();
    p2 = p2.then(() => fs.promises.writeFile(DATA_PATH, data));
    const e = performance.now();
  }
  const endAsyncBlock = performance.now();
  await p2;
  console.log(`Total Async thread-blocking time for queueing 100 writes: ${(endAsyncBlock - startAsyncBlock).toFixed(2)} ms`);

  fs.unlinkSync(DATA_PATH);
}

run();
