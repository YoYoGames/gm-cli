import { buildCommand } from "@stricli/core";

export const loginCommand = buildCommand({
  loader: async () => import("./impl"),
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Access key",
          placeholder: "access-key",
          parse: String,
        },
      ],
    },
    flags: {},
  },
  docs: {
    brief: "Log in with an access key",
  },
});
