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
import type { Cache } from "~/cache";
import type { Context } from "~/context";
import { spawnGmrt } from "./spawn";
import { installGmrtIfNeeded } from "~/gmrt/install-runtime";
import type { GmrtTarget } from "~/target";
import type { GmrtVersionRange } from "~/toolchain";
import type { ProjectPath } from "~/project";
import {
  defaultBuildGraph,
  defaultJob,
  type GmrtToolchainOptions,
} from "./options";

export async function useGmrt(
  ctx: Context,
  cache: Cache,
  command:
    | { type: "run" }
    | { type: "compile" }
    | {
        type: "package";
        outputPath?: string;
      },
  options: {
    prefabsDir: string;
    projectPath: ProjectPath;
    target: GmrtTarget;
    runtime: "native" | "vm";
    licenseFile: string;
    verbose: boolean;
    version?: GmrtVersionRange;
    toolchainOptions: Partial<GmrtToolchainOptions>;
  },
  tools: {
    gmpmExecutablePath: string;
    projectToolPath: string;
  },
) {
  const gmrtDownloadLog = ctx.makeTaskLogger("Downloading GMRT");

  const { runtimeDir, gmrtPath } = await installGmrtIfNeeded(
    ctx,
    cache,
    gmrtDownloadLog,
    {
      version: options.version,
      gmpmPath: tools.gmpmExecutablePath,
      verbose: options.verbose,
    },
  );
  gmrtDownloadLog.success("GMRT downloaded");

  // Prep caches
  const buildCacheDir = await cache.getSubDirPath(
    ctx,
    `build-cache-gmrt-${options.target}-${options.runtime}`,
  );

  const buildDir = await cache.getSubDirPath(
    ctx,
    `build-gmrt-${options.target}-${options.runtime}`,
  );

  // Use defaults if options where not specified
  const { buildGraph, job, scriptBuildType }: GmrtToolchainOptions = {
    buildGraph:
      options.toolchainOptions.buildGraph ?? defaultBuildGraph(ctx, runtimeDir),
    job:
      options.toolchainOptions.job ??
      defaultJob(options.target, options.runtime, command.type),
    scriptBuildType: options.toolchainOptions.scriptBuildType ?? "Debug",
  };

  const gmrtInvokeLog = ctx.makeTaskLogger(`GMRT ${command.type}`, {
    noCollapse: true,
  });

  await spawnGmrt(ctx, gmrtInvokeLog, {
    gmrtPath,
    verbose: options.verbose,
    args: [
      options.projectPath,
      "-o",
      buildDir,
      "-bg",
      buildGraph,
      "-bj",
      job,
      ...(options.verbose ? ["-v"] : []),
      "--script-build-type",
      scriptBuildType,
      "--cache-dir",
      buildCacheDir,
      "--prefab-dir",
      options.prefabsDir,
      "--projecttool",
      tools.projectToolPath,
      "-lf",
      options.licenseFile,
      // TODO: when should this be different?
      "--launch-type",
      "run",
      // Always set like this for now
      "--user-config",
      "Default",
      "--build-type",
      "Release",
      ...(command.type === "package" && command.outputPath
        ? ["--pkg", command.outputPath]
        : []),
      // FIXME: we might want to add some of these later as part of the toolchain options
      //"--target-options",
      //"--target-preferences",
      //"--gmrt-preferences",
    ],
  });
}
