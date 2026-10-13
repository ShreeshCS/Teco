import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from 'path'
// import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],

  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },

  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
