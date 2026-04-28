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
import { Cache, type CacheType } from "~/cache";
import type { Context } from "~/context";
import { findProjectFile, parseProjectPath } from "~/project";

export const FLAGS = {
  project: {
    kind: "parsed",
    parse: parseProjectPath,
    brief: "Path to the project .yyp file",
    optional: true,
  },
  cacheDir: {
    kind: "parsed",
    parse: String,
    brief: "Cache directory",
    optional: true,
  },
} as const;

export const cacheInfoCommand = buildCommand({
  loader: async () => import("./info-impl"),
  parameters: {
    positional: { kind: "tuple", parameters: [] },
    flags: FLAGS,
  },
  docs: {
    brief: "Show cache information",
  },
});

export const cacheCleanCommand = buildCommand({
  loader: async () => import("./clean-impl"),
  parameters: {
    positional: { kind: "tuple", parameters: [] },
    flags: FLAGS,
  },
  docs: {
    brief: "Clean the cache",
  },
});

export const cacheCommand = buildRouteMap({
  routes: {
    info: cacheInfoCommand,
    clean: cacheCleanCommand,
  },
  docs: {
    brief: "Manage the cache",
  },
  defaultCommand: "info",
});

export interface CacheFlags {
  project?: string;
  cacheDir?: string;
}

export async function setupCache(
  ctx: Context,
  flags: CacheFlags,
): Promise<Cache> {
  let cacheType: CacheType;
  if (flags.cacheDir) {
    cacheType = { type: "absolute", path: flags.cacheDir };
  } else if (flags.project) {
    cacheType = { type: "infer", projectDir: ctx.path.dirname(flags.project) };
  } else {
    // Try inferring from cwd.
    const projectPath = await findProjectFile(ctx, ctx.process.cwd());
    if (!projectPath) {
      cacheType = {
        type: "shared-only",
      };
    } else {
      cacheType = { type: "infer", projectDir: ctx.path.dirname(projectPath) };
    }
  }

  return new Cache(ctx, cacheType);
}

export function validateFlags(flags: CacheFlags): void {
  if (flags.project !== undefined && flags.cacheDir !== undefined) {
    throw new Error(
      "Options --project and --cache-dir are mutually exclusive. You can't specify both at the same time.",
    );
  }
}
