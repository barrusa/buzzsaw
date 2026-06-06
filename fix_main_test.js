const fs = require('fs');

let content = fs.readFileSync('src/main.test.ts', 'utf8');

content = content.replace(/<<<<<<< HEAD\n  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;\n=======\n  \/\/ eslint-disable-next-line @typescript-eslint\/no-explicit-any\n  let consoleErrorSpy: any;\n>>>>>>> cc4488e \(Refactor: Extract duplicated `open-floor` and `reset-game` logic\)/g, '  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;');

fs.writeFileSync('src/main.test.ts', content);
