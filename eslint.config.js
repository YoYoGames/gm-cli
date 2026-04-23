import * as path from "node:path";

import { includeIgnoreFile } from "@eslint/compat";
import eslint from "@eslint/js";
import header from "@tony.ganchev/eslint-plugin-header";
import "eslint-plugin-only-warn";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  includeIgnoreFile(path.join(import.meta.dirname, ".gitignore")),
  { ignores: ["**/*.config.*", "scripts", "config"] },
  eslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    rules: {
      curly: "warn",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  { plugins: {} },
  {
    files: ["src/**/*.ts"],
    plugins: { "@tony.ganchev": header },
    rules: {
      "@tony.ganchev/header": [
        "warn",
        { header: { file: "config/license-header.js" } },
      ],
    },
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    linterOptions: { reportUnusedDisableDirectives: true },
  },
  {
    ignores: ["dist/**"],
  },
);
