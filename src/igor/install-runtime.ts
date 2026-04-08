import type { Cache } from "../cache";
import { exists, type Context } from "../context";
import type { Log } from "../log";
import { KnownError } from "../error";
import type { Target } from "./target";
import { getInstalledRuntimeModules } from "./target";
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
    cache,
    target,
  }: {
    licenseFile: string;
    igorPath: string;
    cache: Cache;
    target: Target;
  },
): Promise<string> {
  const runtimeDir = await cache.getSubDirPath(ctx, "runtime");
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

  if (installedModules.includes(target)) {
    log.success("Runtime found");
    return runtimeLocation!;
  }

  // Install into a temporary directory first, then merge into the real
  // runtime dir. This avoids overwriting modules that were already installed
  // by a previous call.
  const tempDir = await ctx.fs.mkdtemp(
    ctx.path.join(ctx.os.tmpdir(), "gm-runtime-"),
  );

  try {
    await installRuntime(ctx, log, {
      igorPath,
      runtimeDir: tempDir,
      modules: [target],
      licenseFile,
    });

    const tempRuntimeLocation = await findRuntimeLocation(ctx, tempDir);
    const runtimeName = ctx.path.basename(tempRuntimeLocation);
    const destLocation = ctx.path.join(runtimeDir, runtimeName);

    // Read the existing receipt before copying so we can merge it
    const receiptPath = ctx.path.join(destLocation, "receipt.json");
    let existingReceipt: Record<string, unknown> = {};
    try {
      existingReceipt = JSON.parse(await ctx.fs.readFile(receiptPath, "utf-8"));
    } catch {
      // No existing receipt
    }

    await ctx.fs.mkdir(destLocation, { recursive: true });
    await ctx.fs.cp(tempRuntimeLocation, destLocation, { recursive: true });

    // Merge the old receipt entries into the new one so previously
    // installed modules are not forgotten.
    const newRaw = await ctx.fs.readFile(receiptPath, "utf-8");
    const mergedReceipt = { ...existingReceipt, ...JSON.parse(newRaw) };
    await ctx.fs.writeFile(receiptPath, JSON.stringify(mergedReceipt, null, 2));
  } catch (e) {
    log.error("Failed to install runtime");
    throw new KnownError(e);
  } finally {
    await ctx.fs.rm(tempDir, { recursive: true, force: true });
  }
  log.success("Runtime installed");

  runtimeLocation = await findRuntimeLocation(ctx, runtimeDir);
  await installationFixup(ctx, runtimeLocation);
  return runtimeLocation;
}
