/**
 * Copyright 2026, Opera Norway AS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at:
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { buildCommand } from "@stricli/core";
import { TARGETS, TargetSchema } from "~/target";
import { parseToolchainVersion } from "~/toolchain";

export const packageCommand = buildCommand({
  loader: async () => import("./impl"),
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Path to the project .yyp file",
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
        brief:
          "The platform the game will run on ('windows', 'mac', 'linux', 'operagx', etc.)",
        optional: true,
      },
      toolchain: {
        kind: "parsed",
        parse: parseToolchainVersion,
        brief: "Toolchain to use, e.g. GMS2, GMS2@2024.14.4, or GMRT@0.18",
        optional: true,
      },
      runtime: {
        kind: "enum",
        values: ["vm", "native"],
        default: "vm",
        brief: "Virtual machine (VM) or ahead-of-time native compilation.",
        optional: true,
      },
      verbose: {
        kind: "boolean",
        brief: "Verbose output",
        optional: true,
      },
      errorsOnly: {
        kind: "boolean",
        brief: "Suppress all output except errors",
        optional: true,
      },
      license: {
        kind: "parsed",
        parse: String,
        brief: "License .plist file (can also set env GAMEMAKER_CLI_LICENSE)",
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
      config: {
        kind: "parsed",
        parse: String,
        brief: "GameMaker project config to build with (default: 'Default')",
        optional: true,
      },
      toolchainOptions: {
        kind: "parsed",
        parse: String,
        brief: "JSON string of toolchain-specific options",
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
