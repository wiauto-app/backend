import path from "node:path";

import swc from "unplugin-swc";
import type { PluginOption } from "vite";

const root = path.resolve(__dirname);

export const vitestPathAliases = {
  "@/src": path.join(root, "src"),
  "@/app": path.join(root, "src/app"),
  "@/contexts": path.join(root, "src/contexts"),
  "@/shared": path.join(root, "src/contexts/shared"),
  "@/tests": path.join(root, "tests"),
  "@": root,
};

export const vitestSwcPlugins = (): PluginOption[] => [
  swc.vite({
    module: { type: "es6" },
  }),
];
