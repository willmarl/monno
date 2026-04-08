import { defineConfig } from 'vitest/config';
import path from 'path';
import * as dotenv from 'dotenv';

// Load test env vars before any worker threads start.
// This ensures DATABASE_URL points at the test DB for all tests.
dotenv.config({ path: path.resolve(__dirname, '.env.test'), override: true });

export default defineConfig({
  test: {
    environment: 'node',
    // Unit tests only — no DB required, no globalSetup
    include: ['src/**/*.spec.ts'],
    exclude: ['src/**/*.integration.spec.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 10000,
    isolate: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/**/*.spec.ts'],
    },
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src'),
    },
  },
});
