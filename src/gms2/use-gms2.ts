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
    config?: string;
  },
  tools: {
    igorPath: string;
    projectToolPath: string;
  },
) {
  const runtime = options.runtime === "native" ? "YYC" : "VM";
  const defaults = defaultGms2ToolchainOptions();
  const toolchainOptions: Gms2ToolchainOptions = {
    operagx: options.toolchainOptions.operagx ?? defaults.operagx,
    windows: options.toolchainOptions.windows ?? defaults.windows,
    mac: options.toolchainOptions.mac ?? defaults.mac,
    linux: options.toolchainOptions.linux ?? defaults.linux,
  };

  if (runtime === "YYC" && options.target === "windows") {
    throw new KnownError(
      "Support for the native runtime (YYC) is coming soon to GameMaker CLI.",
    );
  }

  if (
    runtime === "YYC" &&
    options.target === "operagx" &&
    !toolchainOptions.operagx.emscriptenSdk
  ) {
    throw new KnownError(
      "Building for OperaGX with YYC requires setting a path to the Emscripten SDK.\nSet gms2.operagx.emscriptenSdk in gm-options.json. or --toolchain-options",
    );
  }

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

  const userDir = await createLocalSettings(ctx, cache, toolchainOptions);

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
    const projectDir = ctx.path.dirname(options.projectPath);
    const projectName = getProjectName(ctx, options.projectPath);
    const resolvedOutputPath =
      command.outputPath !== undefined
        ? ctx.path.resolve(projectDir, command.outputPath)
        : undefined;
    const {
      action,
      targetFile,
      extraArgs: packageArgs,
    } = getPackageAction(
      options.target,
      toolchainOptions,
      resolvedOutputPath,
      ctx.path.join(projectDir, projectName),
    );
    igorAction = action;
    extraArgs = ["-tf", targetFile, ...packageArgs];
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
      verbose: options.verbose,
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
          userDir,
          config: options.config,
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

function getPackageAction(
  target: Target,
  options: Gms2ToolchainOptions,
  outputPath: string | undefined,
  defaultBasePath: string,
): {
  action: string;
  targetFile: string;
  extraArgs: string[];
} {
  switch (target) {
    case "windows": {
      const nsis = options.windows.packageType === "nsis";
      return {
        action: nsis ? "PackageNsis" : "PackageZip",
        targetFile: outputPath ?? `${defaultBasePath}${nsis ? ".exe" : ".zip"}`,
        extraArgs: [],
      };
    }
    case "mac": {
      const dmg = options.mac.packageType === "dmg";
      return {
        action: dmg ? "PackageDMG" : "PackageZip",
        targetFile: outputPath ?? `${defaultBasePath}${dmg ? ".dmg" : ".zip"}`,
        extraArgs: [],
      };
    }
    case "operagx": {
      let packageTypeArg: string;
      switch (options.operagx.packageType) {
        case undefined:
        case "zip":
          packageTypeArg = "OperaGXPackage_Zip";
          break;
        case "gamestrip":
          packageTypeArg = "OperaGXPackage_Gamestrip";
          break;
        case "wallpaper":
          packageTypeArg = "OperaGXPackage_Wallpaper";
          break;
        default:
          options.operagx.packageType satisfies never;
          throw new Error("Unreachable");
      }
      return {
        action: "Package",
        targetFile: outputPath ?? `${defaultBasePath}.zip`,
        extraArgs: ["-packagetype", packageTypeArg],
      };
    }
    case "linux": {
      const appimage = options.linux.packageType === "appimage";
      if (
        appimage &&
        outputPath !== undefined &&
        !outputPath.endsWith(".AppImage")
      ) {
        throw new KnownError(
          "When packaging for Linux with AppImage format, the output filename must end in .AppImage.",
        );
      }
      return {
        action: "Package",
        targetFile:
          outputPath ?? `${defaultBasePath}${appimage ? ".AppImage" : ".zip"}`,
        extraArgs: [],
      };
    }
    default:
      throw new KnownError("Target not supported in GM-CLI yet.");
  }
}

async function createLocalSettings(
  ctx: Context,
  cache: Cache,
  toolchainOptions: Gms2ToolchainOptions,
): Promise<string | undefined> {
  const localSettings: Record<string, string> = {};
  if (toolchainOptions.operagx.emscriptenSdk) {
    localSettings["machine.Platform Settings.operagx.sdk_dir"] =
      toolchainOptions.operagx.emscriptenSdk;
  }
  // add more options here...

  if (Object.keys(localSettings).length === 0) {
    return undefined;
  }

  const userDir = await cache.getSubDirPath(ctx, "gms2-local-settings");
  await ctx.fs.writeFile(
    ctx.path.join(userDir, "local_settings.json"),
    JSON.stringify(localSettings, null, 2) + "\n",
  );
  return userDir;
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
  userDir?: string;
  config?: string;
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
    ...(commonArgs.userDir ? ["-uf", commonArgs.userDir] : []),
    ...(commonArgs.config ? ["-config", commonArgs.config] : []),
    ...extraArgs,
    "--",
    commonArgs.target,
    action,
  ];
}
