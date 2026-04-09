import { buildCommand } from "@stricli/core";
import { TARGETS, TargetSchema } from "../../igor";

export const compileProjectCommand = buildCommand({
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
        brief: "The platform target to compile for",
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
    },
  },
  docs: {
    brief: "Compile the project",
  },
});
