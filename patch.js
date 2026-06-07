const fs = require('fs');

let content = fs.readFileSync('src/main.test.ts', 'utf-8');

const replacement = `  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('should successfully save config and log', async () => {
    await saveConfig();

    expect(fs.promises.writeFile).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith('Saved config to', MOCK_DATA_PATH);
  });

  it('should catch and log errors thrown by fs.promises.writeFile', async () => {
    const mockError = new Error('Disk full');
    (fs.promises.writeFile as any).mockRejectedValueOnce(mockError);

    await saveConfig();

    expect(fs.promises.writeFile).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save config:', mockError);
  });
});`;

content = content.replace(/<<<<<<< HEAD[\s\S]*?>>>>>>> origin\/main\n  \}\);\n\}\);/, replacement);

fs.writeFileSync('src/main.test.ts', content);
