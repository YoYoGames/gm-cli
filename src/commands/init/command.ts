import { buildCommand } from "@stricli/core";

export const initCommand = buildCommand({
  loader: async () => import("./impl"),
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [],
    },
    flags: {
      interactive: {
        kind: "boolean",
        brief: "Run interactive wizard",
        default: true,
      },
      name: {
        kind: "parsed",
        parse: String,
        brief: "Project name (required if --no-interactive)",
        optional: true,
      },
      template: {
        kind: "parsed",
        parse: String,
        brief:
          "Template ID or partial name match (required if --no-interactive)",
        optional: true,
      },
      ai: {
        kind: "boolean",
        brief: "Set up AI scaffolding (MCP, CLAUDE.md, etc.)",
        default: true,
      },
      cacheDir: {
        kind: "parsed",
        parse: String,
        brief: "Cache directory",
        optional: true,
      },
    },
    aliases: {
      n: "name",
      t: "template",
    },
  },
  docs: {
    brief: "Initialize a new project",
  },
});
