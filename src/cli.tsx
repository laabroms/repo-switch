import React from 'react';
import { render } from 'ink';
import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { App } from './App.js';

const SHELL_FUNC = 'rs() { local dir=$(repo-switch 2>/dev/null); [ -n "$dir" ] && cd "$dir"; }';

function hasShellFunction(): boolean {
  const home = homedir();
  const rcFiles = ['.zshrc', '.bashrc', '.bash_profile'];

  for (const rc of rcFiles) {
    try {
      const content = readFileSync(join(home, rc), 'utf8');
      if (content.includes('repo-switch')) return true;
    } catch {
      // file doesn't exist
    }
  }
  return false;
}

if (!hasShellFunction()) {
  process.stderr.write('\n\x1b[33m⚠  Shell function not found.\x1b[0m Add this to your ~/.zshrc:\n\n');
  process.stderr.write(`  \x1b[36m${SHELL_FUNC}\x1b[0m\n\n`);
  process.stderr.write('Then run \x1b[1msource ~/.zshrc\x1b[0m and use \x1b[1mrs\x1b[0m instead of \x1b[1mrepo-switch\x1b[0m\n\n');
}

// Render TUI to stderr so stdout is clean for the selected path
render(<App />, {
  stdout: process.stderr,
  stdin: process.stdin,
});
