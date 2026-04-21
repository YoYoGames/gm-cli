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
      cacheDir: {
        kind: "parsed",
        parse: String,
        brief: "Cache directory",
        optional: true,
      },
    },
  },
  docs: {
    brief: "Sign-in using an access key",
    fullDescription:
      "Sign-in using an access key.\n\nYou can issue an access key at: https://gamemaker.io/en/account/access-keys",
  },
});
