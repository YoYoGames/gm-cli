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

import type { Cache } from "./cache";
import { exists, type Context } from "./context";
import type { Log } from "./log";
import {
  npmInstall,
  getPlatformSuffix,
  type PlatformSuffixes,
  GMPM_REGISTRY,
} from "./npm";

export async function downloadProjectTool(
  ctx: Context,
  cache: Cache,
  log: Log,
  options: { verbose: boolean },
) {
  return download(
    ctx,
    "project-tool",
    cache,
    log,
    options,
    (destDir, packageName) => {
      switch (ctx.process.platform) {
        case "darwin":
          return ctx.path.join(
            destDir,
            "lib",
            "node_modules",
            packageName,
            "Contents",
            "MacOS",
            "ProjectTool",
          );
        case "win32":
          return ctx.path.join(
            destDir,
            "node_modules",
            packageName,
            "ProjectTool.exe",
          );
        default:
          return ctx.path.join(
            destDir,
            "lib",
            "node_modules",
            packageName,
            "ProjectTool",
          );
      }
    },
  );
}

export async function downloadGmpm(
  ctx: Context,
  cache: Cache,
  log: Log,
  { verbose }: { verbose: boolean },
) {
  return download(
    ctx,
    "gmpm",
    cache,
    log,
    {
      verbose,
      // Note: GMRT relies on GMPM using the mac- suffix instead of osx- like most other @gm-tools
      platformSuffixOverride: {
        darwin: { arm64: "mac-arm64", x64: "mac-arm64" },
      },
    },
    (destDir, packageName) => {
      // Note: we only want the DLL file (regardless of platform)
      if (ctx.process.platform === "darwin") {
        return ctx.path.join(
          destDir,
          "lib",
          "node_modules",
          packageName,
          "bundle",
          "Contents",
          "MacOS",
          "gmpm.dll",
        );
      }
      if (ctx.process.platform === "win32") {
        return ctx.path.join(destDir, "node_modules", packageName, "gmpm.dll");
      }
      return ctx.path.join(
        destDir,
        "lib",
        "node_modules",
        packageName,
        "gmpm.dll",
      );
    },
  );
}

export async function downloadPackageTool(
  ctx: Context,
  cache: Cache,
  log: Log,
  options: { verbose: boolean },
) {
  return download(
    ctx,
    "package-tool",
    cache,
    log,
    options,
    (destDir, packageName) => {
      switch (ctx.process.platform) {
        case "darwin":
          return ctx.path.join(
            destDir,
            "lib",
            "node_modules",
            packageName,
            "Contents",
            "MacOS",
            "PackageTool",
          );
        case "win32":
          return ctx.path.join(
            destDir,
            "node_modules",
            packageName,
            "PackageTool.exe",
          );
        default:
          return ctx.path.join(
            destDir,
            "lib",
            "node_modules",
            packageName,
            "PackageTool",
          );
      }
    },
  );
}

async function download(
  ctx: Context,
  name: string,
  cache: Cache,
  log: Log,
  {
    verbose,
    platformSuffixOverride,
  }: {
    verbose: boolean;
    platformSuffixOverride?: {
      [K in keyof PlatformSuffixes]?: Partial<PlatformSuffixes[K]>;
    };
  },
  getPath: (destDir: string, packageName: string) => string,
): Promise<string> {
  const destDir = await cache.getSubDirPath(ctx, name);
  const platformSuffix = getPlatformSuffix(ctx, platformSuffixOverride);
  const packageName = `@gm-tools/${name}-${platformSuffix}`;
  const toolPath = getPath(destDir, packageName);

  if (await exists(ctx, toolPath)) {
    log.message(`Found ${name}`);
    return toolPath;
  }
  // not yet downloaded

  log.message(`Installing ${name}`);
  await npmInstall(ctx, log, {
    prefix: destDir,
    packageName,
    registry: GMPM_REGISTRY,
    verbose,
  });

  if (!(await exists(ctx, toolPath))) {
    throw new Error(`Expected to find ${packageName} at path ${toolPath}`);
  }

  if (ctx.process.platform !== "win32") {
    await ctx.fs.chmod(toolPath, 0o755);
  }

  return toolPath;
}
