import { defineConfig } from "vitest/config";

import { createVitestTestConfig } from "./create-vitest-test-config";
import { vitestPathAliases, vitestSwcPlugins } from "./vitest.shared";

export default defineConfig({
  test: createVitestTestConfig("e2e"),
  resolve: {
    alias: vitestPathAliases,
  },
  plugins: vitestSwcPlugins(),
});
