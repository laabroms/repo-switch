import React from 'react';
import { render } from 'ink';
import { App } from './App.js';

// Render TUI to stderr so stdout is clean for the selected path
const { waitUntilExit } = render(<App />, {
  stdout: process.stderr,
  stdin: process.stdin,
});
