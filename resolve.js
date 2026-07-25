const fs = require('fs');
let code = fs.readFileSync('src/tests/main.test.ts', 'utf8');

// The main branch resolved the saveConfig test by modifying the player array to bust cache
// But it uses `vi.mocked(fs.writeFileSync)`, which failed on my end unless I used `(fs as any).writeFileSync` or `(fs as any).default.writeFileSync`. Wait, no, main branch already committed this and it's passing in main, probably because of the way fs was mocked in main branch or how tsconfig is set. Let's look at the top of the file in main to see what they did to `fs` mock.
