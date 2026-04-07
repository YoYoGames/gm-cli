import { buildCommand } from "@stricli/core";

export const editCommand = buildCommand({
  loader: async () => import("./impl"),
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Path to the project yyp file",
          placeholder: "project",
          parse: String,
          optional: true,
        },
      ],
    },
    flags: {
      mcp: {
        kind: "boolean",
        brief: "Run in Model Context Protocol mode",
        optional: true,
      },
      command: {
        kind: "parsed",
        brief: "Run a one-shot command",
        parse: String,
        optional: true,
      },
    },
    aliases: {
      C: "command",
    },
  },
  docs: {
    brief: "Query or mutate resources in a project",
  },
});
