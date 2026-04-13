import { exists, getPrefabsDirOrThrow, type Context } from "./context";
import {
  targetForPlatform,
  downloadIgor,
  installRuntimeIfNeeded,
  type Target,
  type CommonIgorBuildArgs,
  fetchLicense,
} from "./igor";
import { downloadProjectTool } from "./projectTool";
import { KnownError } from "./error";
import { LICENSE_FILENAME } from "./commands/login/impl";
import { findProjectFile, type ProjectPath } from "./project";
import { Cache } from "./cache";
import type { Log } from "./log";
import type { ToolchainVersion } from "./toolchain";

/**
 * Command flags exposed in package/run/compile
 */
export interface CommonCliBuildFlags {
  target?: Target;
  toolchain?: ToolchainVersion;
  verbose?: boolean;
  license?: string;
  prefabs?: string;
  cacheDir?: string;
}

const GUEST_ACCESS_KEY = "09bdd0bc8c2f6cce3391a16679ede918";

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

  const cachedLicenseFile = ctx.path.join(cache.dirPath, LICENSE_FILENAME);
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
 * Setup the cache, Igor, and install the required runtime for a build
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
  const cwd = ctx.process.cwd();
  const target = flags.target ?? targetForPlatform(ctx.process.platform);
  const projectPath = project ?? (await findProjectFile(ctx, cwd));

  if (flags.toolchain?.type === "GMRT") {
    throw new KnownError("GMRT support coming soon!"); // FIXME
  }

  if (flags.toolchain?.version !== undefined) {
    throw new KnownError(
      "Specifing the toolchain version is not yet supported",
    ); // FIXME
  }

  const cache = await Cache.getOrInit(ctx, flags.cacheDir);

  const igorLog = ctx.makeTaskLogger("Downloading Igor");
  let igorPath: string;
  try {
    igorPath = await downloadIgor(ctx, igorLog, cache);
  } catch (e) {
    igorLog.error("Failed to download Igor");
    throw new KnownError(e);
  }
  igorLog.success("Igor downloaded");

  const projectToolLog = ctx.makeTaskLogger("Downloading ProjectTool");
  let projectToolPath: string;
  try {
    projectToolPath = await downloadProjectTool(ctx, {
      cache,
      log: projectToolLog,
      verbose: flags.verbose ?? false,
    });
  } catch (e) {
    projectToolLog.error("Failed to download ProjectTool");
    throw new KnownError(e);
  }
  projectToolLog.success("ProjectTool downloaded");

  const licenseLog = ctx.makeTaskLogger("Fetching license");
  const licenseFile = await getLicense(ctx, flags, cache, igorPath, licenseLog);
  licenseLog.success("License fetched");

  const runtimeLog = ctx.makeTaskLogger("Installing runtime");
  const runtimeLocation = await installRuntimeIfNeeded(ctx, runtimeLog, {
    licenseFile,
    igorPath,
    cache,
    target,
  });

  const buildCacheDir = await cache.getSubDirPath(ctx, "build");

  const actionLog = ctx.makeTaskLogger(action.label(target));
  let successMessage: string;
  try {
    ({ successMessage } = await action.invoke(ctx, actionLog, {
      igorPath,
      runtimeDir: runtimeLocation,
      target,
      cacheDir: buildCacheDir,
      prefabsDir: flags.prefabs ?? getPrefabsDirOrThrow(ctx),
      licenseFile,
      projectPath,
      projectToolPath,
      verbose: flags.verbose ?? false,
    }));
  } catch (e) {
    actionLog.error("Compilation failed");
    throw new KnownError(e);
  }
  actionLog.success(successMessage);
}
