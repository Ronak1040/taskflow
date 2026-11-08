import { fileURLToPath } from 'url';
import path from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react()],
  test: {
    root: path.resolve(__dirname),
    globals: true,
    environment: 'jsdom',
    setupFiles: [path.resolve(__dirname, './src/tests/setup.ts')],
    include: ['src/tests/**/*.spec.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
