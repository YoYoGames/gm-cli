import { exists, type Context } from "../context";
import type { Log } from "../log";
import { KnownError } from "../error";
import type { Module, Target } from "./target";
import { baseModuleForPlatform, getInstalledRuntimeModules } from "./target";
import { findRuntimeLocation, installRuntime } from "./run";

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

export async function installRuntimeIfNeeded(
  ctx: Context,
  log: Log,
  {
    licenseFile,
    igorPath,
    runtimeDir,
    target,
  }: {
    licenseFile: string;
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
      licenseFile,
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
