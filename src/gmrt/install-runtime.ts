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

import { promisify } from "node:util";
import type { Cache } from "~/cache";
import { type Context } from "~/context";
import { type Log, noopLog } from "~/log";
import { npmGetLatestVersion, getPlatformSuffix } from "~/npm";
import { spawnProcess } from "~/spawn";
import semver from "semver";
import {
  type GmrtVersionRange,
  type GmrtVersion,
  gmrtVersionSchema,
} from "~/toolchain";
import { KnownError } from "~/error";

// No mac-x64 or linux-arm64 packages exist; fall back to the closest available build.
const GMRT_PLATFORM_SUFFIX_OVERRIDES = {
  darwin: { arm64: "mac-arm64" as const, x64: "mac-arm64" as const }, // FIXME: throw error x64 mac!
  linux: { arm64: "linux-x64" as const },
};

const GMRT_REGISTRY = "https://gmrt-gmpm.gamemaker.io";

async function resolveVersion(
  ctx: Context,
  version?: GmrtVersionRange,
): Promise<GmrtVersion> {
  const packageName =
    gmrtPackageName(ctx) + "@" + (version ? version.raw : "latest");
  const versionStr = await npmGetLatestVersion(ctx, packageName, GMRT_REGISTRY);
  if (!versionStr) {
    if (version) {
      // Probably given a non-existing version range like @200.3
      // so we will give a more friendly error message
      throw new KnownError(
        `Could not find a version of GMRT matching '${version.raw}'`,
      );
    }
    throw new KnownError(
      `Could not resolve a version of GMRT. (${packageName}). Maybe you are having network issues?`,
    );
  }

  const parsed = semver.parse(versionStr);
  if (!parsed) {
    throw new Error(
      `Invariant broken: Invalid version returned from registry: ${versionStr}`,
    );
  }

  return parsed;
}

export async function installGmrtIfNeeded(
  ctx: Context,
  cache: Cache,
  log: Log,
  {
    version,
    gmpmPath,
    verbose,
  }: { version?: GmrtVersionRange; gmpmPath: string; verbose?: boolean },
): Promise<{
  gmrtPath: string;
  runtimeDir: string;
}> {
  const runtimesDir = await cache.getSubDirPath(ctx, "runtimes-gmrt", {
    preferShared: true,
  });

  const existingRuntime = await findMatchingRuntime(ctx, runtimesDir, version);
  if (existingRuntime) {
    log.message(`Found existing runtime at '${existingRuntime}'`);
    return {
      gmrtPath: gmrtExecutablePath(ctx, existingRuntime),
      runtimeDir: existingRuntime,
    };
  }

  const resolvedVersion = await resolveVersion(ctx, version);
  const installedDir = ctx.path.join(runtimesDir, resolvedVersion.version);
  const packageName = gmrtPackageName(ctx);
  log.message(`Installing '${packageName}@${resolvedVersion.version}'`);
  await gmpmInstall(ctx, log, {
    gmpmPath,
    packageName,
    packageVersion: resolvedVersion.version,
    outputDir: installedDir,
    verbose,
  });

  // TODO: should not be needed!
  await installationFixup(ctx, installedDir, resolvedVersion);

  return {
    gmrtPath: gmrtExecutablePath(ctx, installedDir),
    runtimeDir: installedDir,
  };
}

async function gmpmInstall(
  ctx: Context,
  log: Log,
  {
    gmpmPath,
    packageName,
    packageVersion,
    outputDir,
    verbose,
  }: {
    gmpmPath: string;
    packageName: string;
    packageVersion: string;
    outputDir: string;
    verbose?: boolean;
  },
): Promise<void> {
  await ctx.fs.mkdir(outputDir, { recursive: true });

  const packageJson = JSON.stringify(
    { dependencies: { [packageName]: packageVersion } },
    null,
    2,
  );

  const packageJsonPath = ctx.path.join(outputDir, "package.json");
  await ctx.fs.writeFile(packageJsonPath, packageJson, "utf8");

  const outputSubDir = ctx.path.join(outputDir, "package");
  const args = [
    "-i",
    "-of",
    outputSubDir,
    ...(verbose ? ["--verbose"] : []),
    "--reg",
    GMRT_REGISTRY,
    packageJsonPath,
  ];

  return spawnProcess(ctx, verbose ? log : noopLog, {
    cmd: gmpmPath,
    args,
    verbose,
    errorLabel: "gmpm install",
  });
}

async function findMatchingRuntime(
  ctx: Context,
  runtimesDir: string,
  version?: GmrtVersionRange,
) {
  const entries = await ctx.fs.readdir(runtimesDir);
  const candidates = entries
    .flatMap((name) => {
      // Ignore directories that we fail to parse
      const parseResult = gmrtVersionSchema.safeParse(name);
      // TODO: log warning!
      if (!parseResult.success) {
        return [];
      }
      // FIXME: dirVersion should probably be a GrmtVersionComplete
      const dirSemVer = semver.minVersion(parseResult.data);
      if (!dirSemVer) {
        return [];
      }
      // If a version was specified, only include runtimes that satisfy the requested range
      if (version && !version.test(dirSemVer)) {
        return [];
      }
      return [{ name, semVer: dirSemVer }];
    })
    // Most recent version first
    .sort((a, b) => b.semVer.compare(a.semVer));

  if (candidates.length === 0) {
    return undefined;
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return ctx.path.join(runtimesDir, candidates[0]!.name);
}

function gmrtPackageName(ctx: Context): string {
  const suffix = getPlatformSuffix(ctx, GMRT_PLATFORM_SUFFIX_OVERRIDES);
  return `@gmrt-group-release-${suffix}/gmrt`;
}

function gmrtExecutablePath(ctx: Context, runtimeDir: string): string {
  return ctx.path.join(
    runtimeDir,
    "package",
    "Release",
    `bin`,
    ctx.os.platform() === "win32" ? "gmrt.exe" : "gmrt",
  );
}

async function installationFixup(
  ctx: Context,
  installedDir: string,
  version: GmrtVersion,
): Promise<void> {
  if (ctx.os.platform() !== "darwin" || !semver.satisfies(version, "0.19.x")) {
    return;
  }

  const releaseDir = ctx.path.join(installedDir, "package", "Release");
  const binDir = ctx.path.join(releaseDir, "bin");

  const dawnSrc = ctx.path.join(
    releaseDir,
    "lib",
    "arm64-apple-darwin",
    "libwebgpu_dawn.dylib",
  );
  const dawnDest = ctx.path.join(binDir, "libwebgpu_dawn.dylib");
  await ctx.fs.copyFile(dawnSrc, dawnDest);

  const assetCompilerPath = ctx.path.join(binDir, "AssetCompiler");
  await promisify(ctx.child_process.execFile)("install_name_tool", [
    "-add_rpath",
    "@executable_path",
    assetCompilerPath,
  ]);
}
