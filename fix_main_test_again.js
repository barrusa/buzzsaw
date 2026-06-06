const fs = require('fs');

let content = fs.readFileSync('src/main.test.ts', 'utf8');

content = content.replace(/    const consoleLogSpy = vi.spyOn\(console, 'log'\).mockImplementation\(\(\) => \{\}\);/g, `    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});`);

fs.writeFileSync('src/main.test.ts', content);
