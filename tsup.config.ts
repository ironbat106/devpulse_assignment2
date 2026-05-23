import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  outDir: "dist",
  clean: true,
  format: ["cjs"],
  target: "node18",
  splitting: false,
  sourcemap: true,
  dts: false
});