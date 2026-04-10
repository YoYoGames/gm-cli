import { buildCommand } from "@stricli/core";
import { TARGETS, TargetSchema } from "../../igor";
import { parseProjectPath } from "../../project";

export const packageCommand = buildCommand({
  loader: async () => import("./impl"),
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Path to the project yyp file",
          placeholder: "project",
          parse: parseProjectPath,
          optional: true,
        },
      ],
    },
    flags: {
      target: {
        kind: "parsed",
        parse: (s) => {
          const parsed = TargetSchema.safeParse(s);
          if (parsed.success) {
            return parsed.data;
          } else {
            throw new Error(`Valid targets: ${TARGETS.join(", ")}`);
          }
        },
        brief: "The platform target to package for",
        optional: true,
      },
      verbose: {
        kind: "boolean",
        brief: "Verbose output",
        optional: true,
      },
      prefabs: {
        kind: "parsed",
        brief: "Prefabs directory",
        parse: String,
        optional: true,
      },
      license: {
        kind: "parsed",
        parse: String,
        brief: "License .plist file",
        optional: true,
      },
      cacheDir: {
        kind: "parsed",
        parse: String,
        brief: "Cache directory",
        optional: true,
      },
      output: {
        kind: "parsed",
        parse: String,
        brief: "Output file path",
        optional: true,
      },
    },
    aliases: {
      o: "output",
    },
  },
  docs: {
    brief: "Package the project",
  },
});
