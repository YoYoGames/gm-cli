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
import { KnownError } from "~/error";
import { spawnIgor } from "~/igor/spawn";
import { stopProcesses } from "~/kill-process";
import { getProjectName, type ProjectPath } from "~/project";
import type { Target } from "~/target";
import type { Gms2VersionPartial } from "~/toolchain";
import { installRuntimeIfNeeded } from "./install-runtime";
import {
  defaultGms2ToolchainOptions,
  type Gms2ToolchainOptions,
} from "./options";

export async function useGms2(
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
    target: Target;
    runtime: "native" | "vm";
    licenseFile: string;
    verbose: boolean;
    version?: Gms2VersionPartial;
    toolchainOptions: Partial<Gms2ToolchainOptions>;
  },
  tools: {
    igorPath: string;
    projectToolPath: string;
  },
) {
  // FIXME: Add full support for configuring YYC, currently the underlying tooling in Gms2ToolchainOptions
  // For example, here it expects to be given a user directory with a local_settings.json file. (At least on windows/operagx)
  if (
    options.runtime === "native" &&
    (options.target === "windows" || options.target === "operagx")
  ) {
    throw new KnownError(
      "Support for the native runtime (YYC) is coming soon to GameMaker CLI.",
    );
  }

  const runtime = options.runtime === "native" ? "YYC" : "VM";

  const runtimeLog = ctx.makeTaskLogger("Installing runtime");
  const runtimeLocation = await installRuntimeIfNeeded(ctx, runtimeLog, {
    licenseFile: options.licenseFile,
    igorPath: tools.igorPath,
    cache,
    version: options.version,
    target: options.target,
  });

  const buildCacheDir = await cache.getSubDirPath(
    ctx,
    `build-gms2-${options.target}-${runtime}`,
  );

  const defaults = defaultGms2ToolchainOptions();
  const toolchainOptions: Gms2ToolchainOptions = {
    operagx: options.toolchainOptions.operagx ?? defaults.operagx,
  };

  let label: string;
  let igorAction: string;
  let extraArgs: string[] = [];
  let successMessage: string;

  if (command.type === "compile") {
    label = `Compiling for ${options.target}`;
    igorAction = "Compile";
    successMessage = "Compilation finished";
  } else if (command.type === "run") {
    label = `Compiling & running for ${options.target}`;
    igorAction = "Run";
    successMessage = "Game exited";
  } else {
    label = `Packaging for ${options.target}`;
    let targetFile: string;
    if (command.outputPath === undefined) {
      const ext = packageExtension(options.target);
      const projectDir = ctx.path.dirname(options.projectPath);
      const projectName = getProjectName(ctx, options.projectPath);
      targetFile = ctx.path.join(projectDir, `${projectName}${ext ?? ""}`);
    } else {
      const projectDir = ctx.path.dirname(options.projectPath);
      targetFile = ctx.path.resolve(projectDir, command.outputPath);
    }
    igorAction = getPackageAction(options.target);
    extraArgs = [
      "-tf",
      targetFile,
      ...(options.target === "operagx"
        ? [
            "-packagetype",
            gxPackageTypeArg(toolchainOptions.operagx.packageType),
          ]
        : []),
    ];
    successMessage = `Package created: ${targetFile}`;
  }

  const actionLog = ctx.makeTaskLogger(label, {
    // To try avoid the scrollback buffer looking really strange when outputting a lot of content, we don't
    // collapse the main output when running/compiling a project.
    noCollapse: true,
  });

  try {
    await spawnIgor(ctx, actionLog, {
      igorPath: tools.igorPath,
      args: constructIgorBuildArgs(
        ctx,
        {
          igorPath: tools.igorPath,
          licenseFile: options.licenseFile,
          prefabsDir: options.prefabsDir,
          runtimeDir: runtimeLocation,
          target: options.target,
          cacheDir: buildCacheDir,
          projectPath: options.projectPath,
          projectToolPath: tools.projectToolPath,
          verbose: options.verbose,
          runtime,
        },
        igorAction,
        extraArgs,
      ),
      label: "Igor",
      onSignal: () => {
        stopProcesses(ctx);
      },
    });
  } catch (e) {
    actionLog.error("Failed");
    throw new KnownError(e);
  }

  actionLog.success(successMessage);
}

function gxPackageTypeArg(
  packageType: Gms2ToolchainOptions["operagx"]["packageType"],
): string {
  switch (packageType) {
    case undefined:
    case "zip":
      return "OperaGXPackage_Zip";
    case "gamestrip":
      return "OperaGXPackage_Gamestrip";
    case "wallpaper":
      return "OperaGXPackage_Wallpaper";
    default:
      packageType satisfies never;
      throw new Error("Unreachable");
  }
}

function getPackageAction(target: Target): string {
  switch (target) {
    case "windows":
    case "mac":
    case "linux":
      return "PackageZip";
    default:
      return "Package";
    // FIXME: exhaustiveness checking and fix for platforms like xbox: PackageSubmissionXboxOne", PackageSubmissionXboxSeriesXS
  }
}

function packageExtension(target: Target): string | undefined {
  switch (target) {
    case "windows":
    case "linux":
    case "mac":
    case "operagx":
      return ".zip";
    default:
      return undefined;
  }
}

export interface CommonIgorBuildArgs {
  igorPath: string;
  licenseFile: string;
  prefabsDir: string;
  runtimeDir: string;
  target: Target;
  cacheDir: string;
  projectPath: ProjectPath;
  projectToolPath: string;
  verbose: boolean;
  runtime: "YYC" | "VM";
}

export function constructIgorBuildArgs(
  ctx: Context,
  commonArgs: CommonIgorBuildArgs,
  action: string,
  extraArgs: string[] = [],
): string[] {
  // Seems like -of argument is ignored on Windows
  const outputFileName =
    ctx.process.platform === "win32"
      ? `${getProjectName(ctx, commonArgs.projectPath)}.win`
      : "outputFile";
  const outputFile = ctx.path.join(
    commonArgs.cacheDir,
    "output",
    outputFileName,
  );
  return [
    "-rp",
    commonArgs.runtimeDir,
    "-cache",
    commonArgs.cacheDir,
    "-project",
    commonArgs.projectPath,
    "-runtime",
    commonArgs.runtime,
    "-of",
    outputFile,
    "-lf",
    commonArgs.licenseFile,
    "-prefabs",
    commonArgs.prefabsDir,
    ...(commonArgs.verbose ? ["-v"] : []),
    "-projectool",
    commonArgs.projectToolPath,
    "-jsonErrors",
    ...extraArgs,
    "--",
    commonArgs.target,
    action,
  ];
}
