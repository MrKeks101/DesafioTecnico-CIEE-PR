import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";

// Separate from vite.config.ts so the app's build config stays untouched by
// test-only settings, but we still reuse it (via mergeConfig) instead of
// redeclaring the React plugin here.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      setupFiles: ["./src/setupTests.ts"],
    },
  }),
);
