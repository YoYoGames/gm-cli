import { exists, type Context } from "../../context";
import type { Log } from "../../log";
import { findProjectFile } from "../../project";
import {
  igorRun,
  targetForPlatform,
  downloadIgor,
  findRuntimeLocation,
  installRuntime,
  type Target,
  type Module,
  getInstalledRuntimeModules,
  baseModuleForPlatform,
} from "../../igor";
import { downloadProjectTool } from "../../projectTool";
import { KnownError } from "../../error";
import { LICENSE_FILENAME } from "../login/impl";

async function installationFixup(ctx: Context, runtimeLocation: string) {
  if (process.platform === "win32") {
    return;
  }
  const binDir = ctx.path.join(runtimeLocation, "bin");
  await chmodRecursive(ctx, binDir);
  if (process.platform === "darwin") {
    await extractDmgs(ctx, runtimeLocation);
  }
}

// FIXME: Igor should do this...
async function extractDmgs(ctx: Context, runtimeLocation: string) {
  const macDir = ctx.path.join(runtimeLocation, "mac");
  let entries: string[];
  try {
    entries = await ctx.fs.readdir(macDir);
  } catch {
    return;
  }
  const dmgs = entries.filter((e) => e.endsWith(".dmg"));
  for (const dmg of dmgs) {
    const dmgPath = ctx.path.join(macDir, dmg);
    const { execFile } = await import("child_process");
    const { promisify } = await import("util");
    const exec = promisify(execFile);

    // Mount the DMG
    const { stdout: mountOut } = await exec("hdiutil", [
      "attach",
      dmgPath,
      "-nobrowse",
      "-readonly",
      "-plist",
    ]);

    // Parse plist output to find mount point
    const mountPointMatch = mountOut.match(
      /<key>mount-point<\/key>\s*<string>([^<]+)<\/string>/,
    );
    if (!mountPointMatch?.[1]) continue;
    const mountPoint: string = mountPointMatch[1];

    try {
      // Find .app bundles in the mounted volume
      const volumeEntries = await ctx.fs.readdir(mountPoint);
      for (const entry of volumeEntries) {
        if (entry.endsWith(".app")) {
          const src = ctx.path.join(mountPoint, entry);
          const dest = ctx.path.join(macDir, entry);
          if (await exists(ctx, dest)) {
            continue;
          }
          await exec("cp", ["-R", src, dest]);
        }
      }
    } finally {
      await exec("hdiutil", ["detach", mountPoint, "-quiet"]);
    }
  }
}

async function chmodRecursive(ctx: Context, dir: string) {
  const entries = await ctx.fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = ctx.path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await chmodRecursive(ctx, fullPath);
    } else {
      await ctx.fs.chmod(fullPath, 0o755);
    }
  }
}

async function installRuntimeIfNeeded(
  ctx: Context,
  log: Log,
  {
    flags,
    igorPath,
    runtimeDir,
    target,
  }: {
    flags: RunCommandFlags;
    igorPath: string;
    runtimeDir: string;
    target: Target;
  },
): Promise<string> {
  let runtimeLocation: string | undefined;
  try {
    runtimeLocation = await findRuntimeLocation(ctx, runtimeDir);
  } catch {
    // Runtime not found
  }

  // FIXME: if this fails, we should delete the runtime dir and try again
  const installedModules = runtimeLocation
    ? await getInstalledRuntimeModules(ctx, runtimeLocation)
    : [];

  const neededModules: Module[] = [];
  if (!installedModules.some((m) => m.startsWith("base"))) {
    neededModules.push(baseModuleForPlatform(ctx));
  }
  if (!installedModules.includes(target)) {
    neededModules.push(target);
  }

  if (neededModules.length === 0) {
    log.success("Runtime found");
    return runtimeLocation!;
  }

  try {
    await installRuntime(ctx, log, {
      igorPath,
      runtimeDir,
      modules: neededModules,
      licenseFile: await getLicenseOrThrow(ctx, flags),
    });
  } catch (e) {
    log.error("Failed to install runtime");
    throw new KnownError(e);
  }
  log.success("Runtime installed");

  runtimeLocation = await findRuntimeLocation(ctx, runtimeDir);
  await installationFixup(ctx, runtimeLocation);
  return runtimeLocation;
}

interface RunCommandFlags {
  target?: Target;
  verbose?: boolean;
  license?: string;
  prefabs?: string;
}

async function getLicenseOrThrow(
  ctx: Context,
  flags: RunCommandFlags,
): Promise<string> {
  if (flags.license !== undefined) {
    return flags.license;
  }

  const envLicense = ctx.process.env["GAMEMAKER_LICENSE"];
  if (envLicense !== undefined) {
    return envLicense;
  }

  const cwd = ctx.process.cwd();
  const cachedLicense = ctx.path.join(cwd, ".gmcache", LICENSE_FILENAME);
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
    "A prefabs directory is required to build. Specify a path with `--prefabs=...` or the GAMEMAKER_PREFABS env variable.\n\nTODO: This should not be required for the user to provide, gm-cli should use the default location.\nBut for now, just do export GAMEMAKER_PREFABS=/Users/Shared/GameMakerStudio2/Prefabs",
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

  const cacheDir = this.path.join(cwd, ".gmcache");
  const igorDir = this.path.join(cacheDir, "igor");
  const runtimeDir = this.path.join(cacheDir, "runtime");

  const projectToolDir = this.path.join(cacheDir, "project-tool");

  const igorLog = this.makeTaskLogger("Downloading Igor");
  let igorPath: string;
  try {
    igorPath = await downloadIgor(this, igorLog, { destDir: igorDir });
  } catch (e) {
    igorLog.error("Failed to download Igor");
    throw new KnownError(e);
  }
  igorLog.success("Igor downloaded");

  const projectToolLog = this.makeTaskLogger("Downloading ProjectTool");
  let projectToolPath: string;
  try {
    projectToolPath = await downloadProjectTool(this, {
      destDir: projectToolDir,
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
    flags,
    igorPath,
    runtimeDir,
    target,
  });

  const buildCacheDir = this.path.join(cacheDir, "build");
  await this.fs.mkdir(buildCacheDir, { recursive: true });

  const buildLog = this.makeTaskLogger(`Building & running for ${target}`);
  try {
    await igorRun(this, buildLog, {
      igorPath,
      runtimeDir: runtimeLocation,
      target,
      cacheDir: buildCacheDir,
      prefabsDir: getPrefabsDirOrThrow(this, flags),
      licenseFile: await getLicenseOrThrow(this, flags),
      projectPath,
      projectToolPath,
      verbose: flags.verbose ?? false,
    });
  } catch (e) {
    buildLog.error("Build failed");
    throw new KnownError(e);
  }
  buildLog.success("Done");
}
