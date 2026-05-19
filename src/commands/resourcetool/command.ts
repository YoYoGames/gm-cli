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

import { buildCommand, buildRouteMap } from "@stricli/core";
import type { Context } from "~/context";
import type { CommonFlags } from "./impl";

const commonFlags = {
  cacheDir: {
    kind: "parsed" as const,
    parse: String,
    brief: "Cache directory",
    optional: true as const,
  },
};

const projectParam = {
  brief: "Path to the project .yyp file",
  placeholder: "project",
  parse: String,
  optional: true as const,
};

export const resourcetoolCommand = buildRouteMap({
  routes: {
    mcp: buildCommand({
      loader: async () => {
        const { run } = await import("./impl");
        return {
          default: async function (
            this: Context,
            flags: CommonFlags,
            project?: string,
          ) {
            return run(this, flags, project, { mode: "mcp" });
          },
        };
      },
      parameters: {
        positional: { kind: "tuple", parameters: [projectParam] },
        flags: commonFlags,
      },
      docs: { brief: "Run as Model Context Protocol server" },
    }),
    eval: buildCommand({
      loader: async () => {
        const { run } = await import("./impl");
        return {
          default: async function (
            this: Context,
            flags: CommonFlags,
            command: string,
            project?: string,
          ) {
            return run(this, flags, project, { mode: "command", command });
          },
        };
      },
      parameters: {
        positional: {
          kind: "tuple",
          parameters: [
            {
              brief: "Command to evaluate",
              placeholder: "command",
              parse: String,
            },
            projectParam,
          ],
        },
        flags: commonFlags,
      },
      docs: { brief: "Evaluate a one-shot command" },
    }),
    repl: buildCommand({
      loader: async () => {
        const { run } = await import("./impl");
        return {
          default: async function (
            this: Context,
            flags: CommonFlags,
            project?: string,
          ) {
            return run(this, flags, project, { mode: "cli" });
          },
        };
      },
      parameters: {
        positional: { kind: "tuple", parameters: [projectParam] },
        flags: commonFlags,
      },
      docs: { brief: "Interactive Read-Evalute-Print-Loop (REPL) session" },
    }),
    script: buildCommand({
      loader: async () => {
        const { run } = await import("./impl");
        return {
          default: async function (
            this: Context,
            flags: CommonFlags,
            file: string,
            project?: string,
          ) {
            return run(this, flags, project, {
              mode: "script",
              file: this.path.resolve(file),
            });
          },
        };
      },
      parameters: {
        positional: {
          kind: "tuple",
          parameters: [
            {
              brief: "Path to the script file",
              placeholder: "file",
              parse: String,
            },
            projectParam,
          ],
        },
        flags: commonFlags,
      },
      docs: { brief: "Run a script file" },
    }),
  },
  docs: {
    brief: "Programmatically read and manipulate project resources",
  },
});
