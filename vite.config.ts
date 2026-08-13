/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// El repositorio se publica en https://jechamo.github.io/murdoku/, de ahí la base.
// En desarrollo la base es '/' para que `npm run dev` funcione sin prefijo.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/murdoku/' : '/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    testTimeout: 60_000,
  },
}));
