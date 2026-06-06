const fs = require('fs');

let content = fs.readFileSync('src/main.ts', 'utf8');

content = content.replace(/<<<<<<< HEAD\nconst resetGame = \(\) => {\n  gameState = 'IDLE';\n  buzzQueue = \[\];\n  earlyBuzzers\.clear\(\);\n  timerValue = 5;\n  if \(timerInterval\) clearInterval\(timerInterval\);\n  timerInterval = null;\n  broadcastState\(\);\n};\n\nipcMain\.on\('open-floor', \(\) => {\n=======\nconst openFloor = \(\) => {\n>>>>>>> cc4488e \(Refactor: Extract duplicated `open-floor` and `reset-game` logic\)/g, 'const openFloor = () => {');

content = content.replace(/<<<<<<< HEAD\n=======\nconst resetGame = \(\) => {\n  gameState = 'IDLE';\n  buzzQueue = \[\];\n  earlyBuzzers\.clear\(\);\n  timerValue = 5;\n  if \(timerInterval\) clearInterval\(timerInterval\);\n  timerInterval = null;\n  broadcastState\(\);\n};\n\n\/\/ --- IPC Handlers ---\n\nipcMain\.on\('open-floor', \(\) => {\n  openFloor\(\);\n}\);\n\n>>>>>>> cc4488e \(Refactor: Extract duplicated `open-floor` and `reset-game` logic\)/g, `const resetGame = () => {
  gameState = 'IDLE';
  buzzQueue = [];
  earlyBuzzers.clear();
  timerValue = 5;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  broadcastState();
};

// --- IPC Handlers ---

ipcMain.on('open-floor', () => {
  openFloor();
});
`);

fs.writeFileSync('src/main.ts', content);
