/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // Ambiente 'node' por enquanto (apenas testes de funcoes puras).
    // jsdom + @testing-library serao adicionados na fase de Design System,
    // quando o primeiro teste de componente for necessario.
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
});
