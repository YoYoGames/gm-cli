import { exists, type Context } from "../../context";
import {
  igorRun,
  targetForPlatform,
  downloadIgor,
  installRuntimeIfNeeded,
  type Target,
} from "../../igor";
import { downloadProjectTool } from "../../projectTool";
import { KnownError } from "../../error";
import { LICENSE_FILENAME } from "../login/impl";
import { findProjectFile } from "../../project";
import { Cache } from "../../cache";

interface RunCommandFlags {
  target?: Target;
  verbose?: boolean;
  license?: string;
  prefabs?: string;
}

async function getLicenseOrThrow(
  ctx: Context,
  flags: RunCommandFlags,
  cache: Cache,
): Promise<string> {
  if (flags.license !== undefined) {
    return flags.license;
  }

  const envLicense = ctx.process.env["GAMEMAKER_LICENSE"];
  if (envLicense !== undefined) {
    return envLicense;
  }

  const cachedLicense = ctx.path.join(cache.dirPath, LICENSE_FILENAME);
  if (await exists(ctx, cachedLicense)) {
    return cachedLicense;
  }

  throw new KnownError(
    "You must provide a license. Specify a .plist file with `--license=...` or the GAMEMAKER_LICENSE env variable.\nAlternatively, use `gm login <access-key>`. You can issue an access key at https://gamemaker.io/en/account/access-keys",
  );
}

function getPrefabsDirOrThrow(ctx: Context, flags: RunCommandFlags): string {
  if (flags.prefabs) {
    return flags.prefabs;
  }

  const envPrefabs = ctx.process.env["GAMEMAKER_PREFABS"];
  if (envPrefabs !== undefined) {
    return envPrefabs;
  }

  throw new KnownError(
    "A prefabs directory is required to compile. Specify a path with `--prefabs=...` or the GAMEMAKER_PREFABS env variable.\n\nTODO: This should not be required for the user to provide, gm-cli should use the default location.\nBut for now, just do export GAMEMAKER_PREFABS=/Users/Shared/GameMakerStudio2/Prefabs",
  );
}

export default async function (
  this: Context,
  flags: RunCommandFlags,
  project?: string,
): Promise<void> {
  const cwd = this.process.cwd();
  const target = flags.target ?? targetForPlatform(this.process.platform);
  const projectPath = project ?? (await findProjectFile(this, cwd));

  const cache = await Cache.getOrInit(this);

  const igorLog = this.makeTaskLogger("Downloading Igor");
  let igorPath: string;
  try {
    igorPath = await downloadIgor(this, igorLog, cache);
  } catch (e) {
    igorLog.error("Failed to download Igor");
    throw new KnownError(e);
  }
  igorLog.success("Igor downloaded");

  const projectToolLog = this.makeTaskLogger("Downloading ProjectTool");
  let projectToolPath: string;
  try {
    projectToolPath = await downloadProjectTool(this, {
      cache,
      log: projectToolLog,
      verbose: flags.verbose ?? false,
    });
  } catch (e) {
    projectToolLog.error("Failed to download ProjectTool");
    throw new KnownError(e);
  }
  projectToolLog.success("ProjectTool downloaded");

  const runtimeLog = this.makeTaskLogger("Installing runtime");
  const runtimeLocation = await installRuntimeIfNeeded(this, runtimeLog, {
    licenseFile: await getLicenseOrThrow(this, flags, cache),
    igorPath,
    cache,
    target,
  });

  const buildCacheDir = await cache.getSubDirPath(this, "build");

  const runLog = this.makeTaskLogger(`Compiling & running for ${target}`);
  try {
    await igorRun(this, runLog, {
      igorPath,
      runtimeDir: runtimeLocation,
      target,
      cacheDir: buildCacheDir,
      prefabsDir: getPrefabsDirOrThrow(this, flags),
      licenseFile: await getLicenseOrThrow(this, flags, cache),
      projectPath,
      projectToolPath,
      verbose: flags.verbose ?? false,
    });
  } catch (e) {
    runLog.error("Compilation failed");
    throw new KnownError(e);
  }
  runLog.success("Done");
}
