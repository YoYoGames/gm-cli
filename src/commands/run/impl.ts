import type { Context } from "../../context";
import { findProjectFile } from "../../project";
import {
  igorRun,
  defaultTarget,
  downloadIgor,
  findRuntimeLocation,
  installRuntime,
  type IgorTarget,
} from "../../igor";
import { downloadProjectTool } from "../../projectTool";
import { KnownError } from "../../error";

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
          // Check if already extracted
          try {
            await ctx.fs.access(dest);
            continue;
          } catch {
            // Not yet extracted, copy it
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

interface RunCommandFlags {
  target?: IgorTarget;
  verbose?: boolean;
}

const LICENSE_FILE = "/Users/eli/dev/gm-cli/gm/test.plist";
const PREFABS_DIR = "/Users/Shared/GameMakerStudio2-Beta/Prefabs";

export default async function (
  this: Context,
  flags: RunCommandFlags,
  project?: string,
): Promise<void> {
  const cwd = this.process.cwd();
  const target = flags.target ?? defaultTarget(this.process.platform);
  const projectPath = project ?? (await findProjectFile(this, cwd));

  const cacheDir = this.path.join(cwd, ".gmcache");
  const igorDir = this.path.join(cacheDir, "igor");
  const runtimeDir = this.path.join(cacheDir, "runtime");

  const projectToolDir = this.path.join(cacheDir, "project-tool");

  const igorLog = this.makeLogger("Downloading Igor");
  let igorPath: string;
  try {
    igorPath = await downloadIgor(this, { destDir: igorDir, log: igorLog });
  } catch (e) {
    igorLog.error("Failed to download Igor");
    throw new KnownError(e);
  }
  igorLog.success("Igor downloaded");

  const projectToolLog = this.makeLogger("Downloading ProjectTool");
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

  let ranInstallation = false;
  try {
    await this.fs.access(runtimeDir);
  } catch {
    const runtimeLog = this.makeLogger("Installing runtime");
    try {
      await installRuntime(this, {
        igorPath,
        runtimeDir,
        licenseFile: LICENSE_FILE,
        log: runtimeLog,
      });
    } catch (e) {
      runtimeLog.error("Failed to install runtime");
      throw new KnownError(e);
    }
    runtimeLog.success("Runtime installed");
    ranInstallation = true;
  }

  const runtimeLocation = await findRuntimeLocation(this, runtimeDir);
  if (ranInstallation) {
    await installationFixup(this, runtimeLocation);
  }

  const buildCacheDir = this.path.join(cacheDir, "build");
  await this.fs.mkdir(buildCacheDir, { recursive: true });

  const buildLog = this.makeLogger(`Building & running for ${target}`);
  try {
    await igorRun(this, {
      igorPath,
      runtimeDir: runtimeLocation,
      target,
      cacheDir: buildCacheDir,
      prefabsDir: PREFABS_DIR,
      licenseFile: LICENSE_FILE,
      projectPath,
      projectToolPath,
      verbose: flags.verbose ?? false,
      log: buildLog,
    });
  } catch (e) {
    buildLog.error("Build failed");
    throw new KnownError(e);
  }
  buildLog.success("Done");
}
