import { buildCommand } from "@stricli/core";
import { IGOR_TARGETS } from "../../igor";

export const runCommand = buildCommand({
  loader: async () => import("./impl"),
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Path to the project yyp file",
          placeholder: "project",
          parse: String, // FIXME: should probably check that this it has a yyp extension
          optional: true,
        },
      ],
    },
    flags: {
      target: {
        kind: "enum",
        values: IGOR_TARGETS,
        brief: "The platform target to run",
        optional: true,
      },
      verbose: {
        kind: "boolean",
        brief: "Verbose output",
        optional: true,
      },
      license: {
        kind: "parsed",
        parse: String,
        brief: "License .plist file",
        optional: true,
      },
      accessKey: {
        kind: "parsed",
        parse: String,
        brief: "Access key",
        optional: true,
      },
    },
  },
  docs: {
    brief: "Run the project",
  },
});
