import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

// Lightweight unit-test config. Pure-logic tests run in the node environment;
// the app itself keeps building via vite.config.ts untouched.
export default defineConfig({
  resolve: {
    alias: { '@': resolve(process.cwd(), 'src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
