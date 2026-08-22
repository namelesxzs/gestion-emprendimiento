import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    environment: "node",
    globalSetup: ["./vitest.globalSetup.mts"],
    env: {
      DATABASE_URL: "file:./test.db",
    },
    // Los tests de integración (importer/actions) comparten una única
    // SQLite de prueba y la limpian en beforeEach — correrlos en paralelo
    // pisaría datos entre archivos.
    fileParallelism: false,
  },
});
