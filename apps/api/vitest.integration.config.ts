import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env.test'), override: true });

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
