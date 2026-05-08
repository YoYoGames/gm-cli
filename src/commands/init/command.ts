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
import { parseToolchainVersion } from "~/toolchain";

export const initCommand = buildCommand({
  loader: async () => import("./impl"),
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [],
    },
    flags: {
      interactive: {
        kind: "boolean",
        brief: "Run interactive wizard",
        default: true,
      },
      name: {
        kind: "parsed",
        parse: String,
        brief: "Project name (required if --no-interactive)",
        optional: true,
      },
      template: {
        kind: "parsed",
        parse: String,
        brief:
          "Template ID or partial name match (required if --no-interactive)",
        optional: true,
      },
      ai: {
        kind: "boolean",
        brief: "Set up AI scaffolding (MCP, CLAUDE.md, etc.)",
        default: true,
      },
      actions: {
        kind: "boolean",
        brief: "Set up GitHub Actions workflows",
        default: true,
      },
      toolchain: {
        kind: "parsed",
        parse: parseToolchainVersion,
        brief: "Toolchain to use, e.g. GMS2, GMS2@2024.14.4, or GMRT@0.18",
        optional: true,
      },
      cacheDir: {
        kind: "parsed",
        parse: String,
        brief: "Cache directory",
        optional: true,
      },
    },
    aliases: {
      n: "name",
      t: "template",
    },
  },
  docs: {
    brief: "Initialize a new project",
  },
});
