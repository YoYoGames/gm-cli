import { buildCommand } from "@stricli/core";
import { TARGETS, TargetSchema } from "~/igor";
import { parseProjectPath } from "~/project";
import { parseToolchainVersion } from "~/toolchain";

export const runCommand = buildCommand({
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
        brief: "The platform target to run",
        optional: true,
      },
      toolchain: {
        kind: "parsed",
        parse: parseToolchainVersion,
        brief: "Toolchain to use, e.g. GMS2, GMS2@2024.14.4, or GMRT@0.18",
        optional: true,
      },
      verbose: {
        kind: "boolean",
        brief: "Verbose output",
        optional: true,
      },
      errorsOnly: {
        kind: "boolean",
        brief: "Only output errors",
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
        brief: "License .plist file (can also set env GAMEMAKER_LICENSE)",
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
    brief: "Run the project",
  },
});
