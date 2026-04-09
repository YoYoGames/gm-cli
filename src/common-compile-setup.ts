import { exists, getPrefabsDirOrThrow, type Context } from "./context";
import {
  targetForPlatform,
  downloadIgor,
  installRuntimeIfNeeded,
  type Target,
  type IgorBuildOptions,
} from "./igor";
import { downloadProjectTool } from "./projectTool";
import { KnownError } from "./error";
import { LICENSE_FILENAME } from "./commands/login/impl";
import { findProjectFile, type ProjectPath } from "./project";
import { Cache } from "./cache";
import type { Log } from "./log";

export interface BuildFlags {
  target?: Target;
  verbose?: boolean;
  license?: string;
  prefabs?: string;
  cacheDir?: string;
}

async function getLicenseOrThrow(
  ctx: Context,
  flags: BuildFlags,
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


export async function commonCompileSetup(
  ctx: Context,
  flags: BuildFlags,
  project: ProjectPath | undefined,
  action: {
    label: (target: Target) => string;
    invoke: (ctx: Context, log: Log, options: IgorBuildOptions) => Promise<void>;
  },
): Promise<void> {
  const cwd = ctx.process.cwd();
  const target = flags.target ?? targetForPlatform(ctx.process.platform);
  const projectPath = project ?? (await findProjectFile(ctx, cwd));

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

  const runtimeLog = ctx.makeTaskLogger("Installing runtime");
  const runtimeLocation = await installRuntimeIfNeeded(ctx, runtimeLog, {
    licenseFile: await getLicenseOrThrow(ctx, flags, cache),
    igorPath,
    cache,
    target,
  });

  const buildCacheDir = await cache.getSubDirPath(ctx, "build");

  const actionLog = ctx.makeTaskLogger(action.label(target));
  try {
    await action.invoke(ctx, actionLog, {
      igorPath,
      runtimeDir: runtimeLocation,
      target,
      cacheDir: buildCacheDir,
      prefabsDir: flags.prefabs ?? getPrefabsDirOrThrow(ctx),
      licenseFile: await getLicenseOrThrow(ctx, flags, cache),
      projectPath,
      projectToolPath,
      verbose: flags.verbose ?? false,
    });
  } catch (e) {
    actionLog.error("Compilation failed");
    throw new KnownError(e);
  }
  actionLog.success("Done");
}
