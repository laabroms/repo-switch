import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.tsx'],
  format: ['esm'],
  target: 'node18',
  bundle: true,
  splitting: false,
  clean: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
