import { exists, type Context } from "./context";
import {
  targetForPlatform,
  downloadIgor,
  installRuntimeIfNeeded,
  type Target,
  type CommonIgorBuildArgs,
  fetchLicense,
} from "./igor";
import {
  downloadGmpm,
  downloadPackageTool,
  downloadProjectTool,
} from "./gmTools";
import { KnownError } from "./error";
import { LICENSE_FILENAME } from "./commands/login/impl";
import { findProjectFile, type ProjectPath } from "./project";
import { Cache } from "./cache";
import { noopLog, type Log } from "./log";
import type { ToolchainVersion } from "./toolchain";
import { restorePrefabs } from "./restorePrefabs";

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

  const envLicense = ctx.process.env["GAMEMAKER_LICENSE"];
  if (envLicense !== undefined) {
    log.message(`Using GAMEMAKER_LICENSE="${envLicense}"`);
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

/**
 * Utility used in run, compile and package commands.
 * Setup the cache, Igor, and install the required runtime for a build.
 */
export async function commonCompileSetup(
  ctx: Context,
  flags: CommonCliBuildFlags,
  project: ProjectPath | undefined,
  action: {
    label: (target: Target) => string;
    invoke: (
      ctx: Context,
      log: Log,
      options: CommonIgorBuildArgs,
    ) => Promise<{ successMessage: string }>;
  },
): Promise<void> {
  if (flags.errorsOnly) {
    ctx = { ...ctx, makeTaskLogger: () => noopLog };
  }

  const cwd = ctx.process.cwd();
  const target = flags.target ?? targetForPlatform(ctx.process.platform);
  const projectPath = project ?? (await findProjectFile(ctx, cwd));
  // We use the name "native" when facing the user instead of YYC so that we can use the same
  // flag for GMRT later too. Default to VM if not set.
  const runtime = flags.runtime === "native" ? "YYC" : "VM";

  // FIXME: Add support for GMRT
  if (flags.toolchain?.type === "GMRT") {
    throw new KnownError(
      "Support for the GMRT toolchain is coming soon to GameMaker CLI.",
    );
  }

  // FIXME: Add full support for all platforms
  if (!["mac", "windows", "linux", "operagx"].includes(target)) {
    throw new KnownError(
      `Support for target '${target}' is coming soon to GameMaker CLI.`,
    );
  }

  // FIXME: Add full support for configuring YYC, currently the underlying tooling
  // expects to be given a user directory with a local_settings.json file. (At least on windows/operagx)
  if (runtime === "YYC" && (target === "windows" || target === "operagx")) {
    throw new KnownError(
      "Support for the native runtime (YYC) is coming soon to GameMaker CLI.",
    );
  }

  const cache = new Cache(
    flags.cacheDir
      ? { type: "absolute", path: flags.cacheDir }
      : { type: "infer", projectDir: ctx.path.dirname(projectPath) },
  );

  const igorLog = ctx.makeTaskLogger("Downloading Igor");
  let igorPath: string;
  try {
    igorPath = await downloadIgor(ctx, igorLog, cache);
  } catch (e) {
    igorLog.error("Failed to download Igor");
    throw new KnownError(e);
  }
  igorLog.success("Igor downloaded");

  const gmToolLog = ctx.makeTaskLogger("Downloading tools");
  let projectToolPath: string;
  let gmpmPath: string;
  let packageToolPath: string;
  try {
    projectToolPath = await downloadProjectTool(ctx, cache, gmToolLog, {
      verbose: flags.verbose ?? false,
    });
    gmpmPath = await downloadGmpm(ctx, cache, gmToolLog, {
      verbose: flags.verbose ?? false,
    });
    packageToolPath = await downloadPackageTool(ctx, cache, gmToolLog, {
      verbose: flags.verbose ?? false,
    });
  } catch (e) {
    gmToolLog.error("Failed to download tools");
    throw new KnownError(e);
  }
  gmToolLog.success("Tools downloaded");

  const licenseLog = ctx.makeTaskLogger("Fetching license");
  const licenseFile = await getLicense(ctx, flags, cache, igorPath, licenseLog);
  licenseLog.success("License fetched");

  const runtimeLog = ctx.makeTaskLogger("Installing runtime");
  const runtimeLocation = await installRuntimeIfNeeded(ctx, runtimeLog, {
    licenseFile,
    igorPath,
    cache,
    version: flags.toolchain?.version,
    target,
  });

  const prefabsLog = ctx.makeTaskLogger("Restoring prefabs");
  try {
    await restorePrefabs(ctx, cache, prefabsLog, {
      projectToolPath,
      projectPath,
      packageToolPath,
      gmpmPath,
      verbose: flags.verbose ?? false,
    });
  } catch (e) {
    prefabsLog.error("Failed to restore prefabs");
    throw e;
  }
  prefabsLog.success("Prefabs restored");

  const buildCacheDir = await cache.getSubDirPath(
    ctx,
    `build-gms2-${target}-${runtime}`,
  );

  const actionLog = ctx.makeTaskLogger(action.label(target));
  let successMessage: string;
  try {
    ({ successMessage } = await action.invoke(ctx, actionLog, {
      igorPath,
      runtimeDir: runtimeLocation,
      target,
      cacheDir: buildCacheDir,
      prefabsDir: await cache.getSubDirPath(ctx, "prefabs"),
      licenseFile,
      projectPath,
      projectToolPath,
      verbose: flags.verbose ?? false,
      runtime,
    }));
  } catch (e) {
    actionLog.error("Compilation failed");
    throw new KnownError(e);
  }
  actionLog.success(successMessage);
}
