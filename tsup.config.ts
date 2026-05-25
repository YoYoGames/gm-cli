import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/bin/cli.ts"],
  format: ["esm"],
  tsconfig: "tsconfig.json",
  clean: true,
  splitting: true,
  minify: true,
  banner: {
    js: `import {createRequire as __createRequire} from 'module';var require=__createRequire(import\.meta.url);`,
  },
  esbuildOptions(options) {
    options.alias = {
      "~": "./src",
    };
    options.loader = {
      ...options.loader,
      ".html": "text",
      ".yml": "text",
    };
  },
});
