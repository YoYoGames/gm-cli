import { promisify } from "node:util";
import type { Cache } from "~/cache";
import { exists, type Context } from "~/context";
import type { Log } from "~/log";
import { KnownError } from "~/error";
import type { Target } from "./target";
import { getInstalledRuntimeModules } from "./target";
import { installRuntime, listRuntimes } from "./spawn";
import { z } from "zod";
import {
  gms2VersionSchema,
  gms2VersionSatisfies,
  gms2VersionCompare,
  type Gms2Version,
  gms2VersionToString,
  type Gms2VersionComplete,
} from "~/toolchain";

const receiptSchema = z.record(z.string(), z.unknown());

async function installationFixup(ctx: Context, runtimeLocation: string) {
  if (ctx.process.platform === "win32") {
    return;
  }
  const binDir = ctx.path.join(runtimeLocation, "bin");
  await chmodRecursive(ctx, binDir);
  if (ctx.process.platform === "darwin") {
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
    const exec = promisify(ctx.child_process.execFile);

    // Mount the DMG
    const { stdout: mountOut } = await exec("hdiutil", [
      "attach",
      dmgPath,
      "-nobrowse",
      "-readonly",
      "-plist",
    ]);

    // Parse plist output to find mount point
    const mountPointMatch =
      /<key>mount-point<\/key>\s*<string>([^<]+)<\/string>/.exec(mountOut);
    if (!mountPointMatch?.[1]) {
      continue;
    }
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

function parseRuntimeVersionFromDirName(name: string): Gms2Version | undefined {
  const versionStr = name.replace(/^runtime-/, "");
  const result = gms2VersionSchema.safeParse(versionStr);
  return result.success ? result.data : undefined;
}

async function findRuntimeLocation(
  ctx: Context,
  runtimeDir: string,
  version?: Gms2Version,
): Promise<string | undefined> {
  const entries = await ctx.fs.readdir(runtimeDir);
  const candidates = entries
    .flatMap((name) => {
      // Ignore directories that we fail to parse
      const dirVersion = parseRuntimeVersionFromDirName(name);
      if (dirVersion === undefined) {
        return [];
      }
      // If a version was specified, we should only include runtimes that satisfies that version!
      if (version && !gms2VersionSatisfies(dirVersion, version)) {
        return [];
      }
      return [{ name, version: dirVersion }];
    })
    // Most recent version first
    .sort((a, b) => gms2VersionCompare(b.version, a.version));

  if (candidates.length === 0) {
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return ctx.path.join(runtimeDir, candidates[0]!.name);
}

export async function installRuntimeIfNeeded(
  ctx: Context,
  log: Log,
  {
    licenseFile,
    igorPath,
    cache,
    target,
    version,
  }: {
    licenseFile: string;
    igorPath: string;
    cache: Cache;
    target: Target;
    version?: Gms2Version;
  },
): Promise<string> {
  const runtimeDir = await cache.getSubDirPath(ctx, "runtimes-gms2");
  let runtimeLocation = await findRuntimeLocation(ctx, runtimeDir, version);

  // FIXME: if this fails, we should delete the runtime dir and try again
  const installedModules = runtimeLocation
    ? await getInstalledRuntimeModules(ctx, runtimeLocation)
    : [];

  if (runtimeLocation && installedModules.includes(target)) {
    log.success("Runtime found");
    return runtimeLocation;
  }

  // Looks like we need to actually download the runtime!

  // let us start by ensuring the version (if provided) actually exists in Igor's RSS feed
  let completeVersion: Gms2VersionComplete | undefined;
  if (version) {
    const allVersions = await listRuntimes(ctx, { igorPath });
    const suitableVersions = allVersions
      .filter((availableVersion) =>
        gms2VersionSatisfies(availableVersion, version),
      )
      // Most recent version first
      .sort((a, b) => gms2VersionCompare(b, a));

    if (suitableVersions.length === 0) {
      const fullList = allVersions.map(gms2VersionToString).join("\n");
      throw new KnownError(
        `No runtime version '${gms2VersionToString(version)}' found. Available options:\n${fullList}`,
      );
    }

    completeVersion = suitableVersions[0];
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
      version: completeVersion,
    });

    const tempRuntimeLocation = await findRuntimeLocation(ctx, tempDir);
    if (!tempRuntimeLocation) {
      throw new Error(
        "Invariant broken: no runtime found in temp directory after installation",
      );
    }
    const runtimeName = ctx.path.basename(tempRuntimeLocation);
    const destLocation = ctx.path.join(runtimeDir, runtimeName);

    // Read the existing receipt before copying so we can merge it
    const receiptPath = ctx.path.join(destLocation, "receipt.json");
    let existingReceipt: Record<string, unknown> = {};
    try {
      existingReceipt = receiptSchema.parse(
        JSON.parse(await ctx.fs.readFile(receiptPath, "utf-8")),
      );
    } catch {
      // No existing receipt
    }

    await ctx.fs.mkdir(destLocation, { recursive: true });
    await ctx.fs.cp(tempRuntimeLocation, destLocation, { recursive: true });

    // Merge the old receipt entries into the new one so previously
    // installed modules are not forgotten.
    const newRaw = await ctx.fs.readFile(receiptPath, "utf-8");
    const mergedReceipt = {
      ...existingReceipt,
      ...receiptSchema.parse(JSON.parse(newRaw)),
    };
    await ctx.fs.writeFile(receiptPath, JSON.stringify(mergedReceipt, null, 2));
  } catch (e) {
    log.error("Failed to install runtime");
    throw new KnownError(e);
  } finally {
    await ctx.fs.rm(tempDir, { recursive: true, force: true });
  }
  log.success("Runtime installed");

  runtimeLocation = await findRuntimeLocation(ctx, runtimeDir);
  if (!runtimeLocation) {
    throw new Error("Invariant broken: no runtime found after installation");
  }
  await installationFixup(ctx, runtimeLocation);
  return runtimeLocation;
}
