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
      verbose: {
        kind: "boolean",
        brief: "Verbose output",
        optional: true,
      },
      mcp: {
        kind: "boolean",
        brief: "Run in Model Context Protocol mode",
        optional: true,
      },
    },
  },
  docs: {
    brief: "Query or mutate resources in a project",
  },
});
