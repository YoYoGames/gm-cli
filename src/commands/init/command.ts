import { buildCommand } from "@stricli/core";

export const initCommand = buildCommand({
  loader: async () => import("./impl"),
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [],
    },
  },
  docs: {
    brief: "Initialize a new project",
  },
});
