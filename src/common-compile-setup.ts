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

import { exists, type Context } from "./context";
import { downloadIgor, fetchLicense } from "./igor";
import {
  downloadGmpm,
  downloadPackageTool,
  downloadProjectTool,
} from "./gm-tools";
import { KnownError } from "./error";
import { LICENSE_FILENAME } from "./commands/login/impl";
import { findProjectFile, type ProjectPath } from "./project";
import { Cache } from "./cache";
import { noopLog, type Log } from "./log";
import type { ToolchainVersion } from "./toolchain";
import { restorePrefabs } from "./restore-prefabs";
import { supportedInGmrt, targetForPlatform, type Target } from "./target";
import { useGmrt } from "./gmrt/use-gmrt";
import { useGms2 } from "./gms2/use-gms2";

/**
 * Command flags exposed in package/run/compile
 */
export interface CommonCliBuildFlags {
  target?: Target;
  toolchain?: ToolchainVersion;
  verbose?: boolean;
  license?: string;
  cacheDir?: string;
  runtime?: "native" | "vm";
  errorsOnly?: boolean;
}

export async function commonCompileSetup(
  ctx: Context,
  flags: CommonCliBuildFlags,
  project: ProjectPath | undefined,
  command:
    | { type: "compile" }
    | { type: "run" }
    | { type: "package"; outputPath?: string },
) {
  if (flags.errorsOnly) {
    ctx = { ...ctx, makeTaskLogger: () => noopLog };
  }

  const runtime = flags.runtime ?? "vm";
  const verbose = flags.verbose ?? false;

  const cwd = ctx.process.cwd();
  const target = flags.target ?? targetForPlatform(ctx.process.platform);
  const projectPath = project ?? (await findProjectFile(ctx, cwd));
  if (projectPath === undefined) {
    throw new KnownError("No .yyp project file found in the current directory");
  }

  // FIXME: Add full support for all platforms
  if (!["mac", "windows", "linux", "operagx"].includes(target)) {
    throw new KnownError(
      `Support for target '${target}' is coming soon to GameMaker CLI.`,
    );
  }

  const cache = await Cache.initLazy(
    ctx,
    flags.cacheDir
      ? { type: "absolute", path: flags.cacheDir }
      : { type: "infer", projectDir: ctx.path.dirname(projectPath) },
  );

  const gmToolLog = ctx.makeTaskLogger("Downloading tools");
  let projectToolPath: string;
  let gmpmDllPath;
  let gmpmExecutablePath;
  let packageToolPath: string;
  try {
    projectToolPath = await downloadProjectTool(ctx, cache, gmToolLog, {
      verbose,
    });
    const gmpm = await downloadGmpm(ctx, cache, gmToolLog, {
      verbose,
    });
    gmpmDllPath = gmpm.gmpmDllPath;
    gmpmExecutablePath = gmpm.gmpmExecutablePath;
    packageToolPath = await downloadPackageTool(ctx, cache, gmToolLog, {
      verbose,
    });
  } catch (e) {
    gmToolLog.error("Failed to download tools");
    throw new KnownError(e);
  }
  gmToolLog.success("Tools downloaded");

  const igorLog = ctx.makeTaskLogger("Downloading Igor");
  let igorPath: string;
  try {
    igorPath = await downloadIgor(ctx, igorLog, cache);
  } catch (e) {
    igorLog.error("Failed to download Igor");
    throw new KnownError(e);
  }
  igorLog.success("Igor downloaded");

  const licenseLog = ctx.makeTaskLogger("Fetching license");
  const licenseFile = await getLicense(ctx, flags, cache, igorPath, licenseLog);
  licenseLog.success("License fetched");

  const prefabsLog = ctx.makeTaskLogger("Restoring prefabs");
  let prefabsDir: string;
  try {
    prefabsDir = await restorePrefabs(ctx, cache, prefabsLog, {
      projectToolPath,
      projectPath,
      packageToolPath,
      gmpmDllPath,
      verbose,
    });
  } catch (e) {
    prefabsLog.error("Failed to restore prefabs");
    throw e;
  }
  prefabsLog.success("Prefabs restored");

  if (flags.toolchain?.type === "GMRT") {
    console.log(target, supportedInGmrt(target));
    if (!supportedInGmrt(target)) {
      throw new Error(`Target '${target}' not supported by GMRT`);
    }
    await useGmrt(
      ctx,
      cache,
      command,
      {
        prefabsDir,
        projectPath,
        target,
        runtime,
        verbose,
        licenseFile,
      },
      {
        gmpmExecutablePath,
        projectToolPath,
      },
    );
    return;
  }
  await useGms2(
    ctx,
    cache,
    command,
    {
      prefabsDir,
      projectPath,
      target,
      runtime,
      verbose,
      licenseFile,
      version:
        flags.toolchain?.type === "GMS2" ? flags.toolchain.version : undefined,
    },
    {
      igorPath,
      projectToolPath,
    },
  );
}

const GUEST_ACCESS_KEY = "09bdd0bc8c2f6cce3391a16679ede918";
const LICENSE_RENEWAL_THRESHOLD_DAYS = 7;

function parseGuestLicenseExpiry(content: string): Date | null {
  if (!/name<\/key>\s*<string>Guest<\/string>/.test(content)) {
    return null;
  }
  const m = /expiry_date<\/key>\s*<string>([^<]+)<\/string>/.exec(content);
  if (!m?.[1]) {
    return null;
  }
  const d = new Date(m[1]);
  return isNaN(d.getTime()) ? null : d;
}

function isExpiringSoon(
  expiry: Date,
  thresholdDays = LICENSE_RENEWAL_THRESHOLD_DAYS,
): boolean {
  const msThreshold = thresholdDays * 24 * 60 * 60 * 1000;
  return expiry.getTime() - Date.now() <= msThreshold;
}

async function getLicense(
  ctx: Context,
  flags: CommonCliBuildFlags,
  cache: Cache,
  igorPath: string,
  log: Log,
): Promise<string> {
  if (flags.license !== undefined) {
    log.message(`Using --license="${flags.license}"`);
    return flags.license;
  }

  const envLicense = ctx.env.GAMEMAKER_CLI_LICENSE;
  if (envLicense !== undefined) {
    log.message(`Using GAMEMAKER_CLI_LICENSE="${envLicense}"`);
    return envLicense;
  }

  const cachedLicenseFile = ctx.path.join(
    await cache.getSubDirPath(ctx, "license"),
    LICENSE_FILENAME,
  );

  if (await exists(ctx, cachedLicenseFile)) {
    const content = await ctx.fs.readFile(cachedLicenseFile, "utf-8");
    const expiry = parseGuestLicenseExpiry(content);
    if (expiry !== null && isExpiringSoon(expiry)) {
      log.message("Guest license expiring soon, renewing...");
      await fetchLicense(ctx, log, {
        igorPath,
        accessKey: GUEST_ACCESS_KEY,
        outputFile: cachedLicenseFile,
      });
    }
  }

  if (!(await exists(ctx, cachedLicenseFile))) {
    // If no cached file exists, issue a guest license and cache that
    log.message("Using guest access key");
    await fetchLicense(ctx, log, {
      igorPath,
      accessKey: GUEST_ACCESS_KEY,
      outputFile: cachedLicenseFile,
    });
  }

  return cachedLicenseFile;
}
