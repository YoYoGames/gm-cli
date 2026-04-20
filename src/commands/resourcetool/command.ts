import { buildCommand, buildRouteMap } from "@stricli/core";
import { parseProjectPath, type ProjectPath } from "~/project";
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

// FIXME: we might want to make the project optional and just not set the global variable when starting resourcetool
const projectParam = {
  brief: "Path to the project yyp file",
  placeholder: "project",
  parse: parseProjectPath,
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
            project?: ProjectPath,
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
            project?: ProjectPath,
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
            project?: ProjectPath,
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
            project?: ProjectPath,
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
  defaultCommand: "repl",
  docs: {
    brief: "Programmatically read and manipulate project resources",
  },
});
