import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import path from 'path';
import fs from 'fs';
import * as dotenv from 'dotenv';

const envTestPath = path.resolve(__dirname, '.env.test');
if (!fs.existsSync(envTestPath)) {
  console.error(`
❌ Missing .env.test file

To run integration tests, you need to create .env.test in apps/api/:

  1. Copy the template:
     cp apps/api/.env.test.template apps/api/.env.test

  2. Start the test database:
     pnpm run db:test:up

  3. Run integration tests:
     pnpm run test:integration

For more details, see setup.md
  `);
  process.exit(1);
}

dotenv.config({ path: envTestPath, override: true });

export default defineConfig({
  plugins: [
    // SWC handles emitDecoratorMetadata — required for NestJS DI in Vitest
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        experimental: { emitAssertForImportAttributes: true },
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.integration.spec.ts'],
    globalSetup: ['./src/test-utils/global-setup.ts'],
    testTimeout: 30000,
    hookTimeout: 60000,
    teardownTimeout: 10000,
    isolate: true,
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src'),
    },
  },
});
