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
    flags: {
      print: {
        kind: "boolean",
        brief: "Print the license to stdout instead of saving to a file",
        optional: true,
      },
    },
  },
  docs: {
    brief: "Log in with an access key",
  },
});
