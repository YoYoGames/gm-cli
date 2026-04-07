import type { Cache } from "../cache";
import type { Context } from "../context";
import { KnownError } from "../error";
import type { Log } from "../log";

const IGOR_ZIPS: Record<string, Record<string, string>> = {
  win32: {
    x64: "https://gms.yoyogames.com/igor_win-x64.zip",
    arm64: "https://gms.yoyogames.com/igor_win-arm64.zip",
  },
  linux: {
    x64: "https://gms.yoyogames.com/igor_linux-x64.zip",
    arm: "https://gms.yoyogames.com/igor_linux-arm.zip",
    arm64: "https://gms.yoyogames.com/igor_linux-arm64.zip",
  },
  darwin: {
    x64: "https://gms.yoyogames.com/igor_osx-x64.zip",
    arm64: "https://gms.yoyogames.com/igor_osx-arm64.zip",
  },
};

const IGOR_PLATFORM_DIRS: Record<string, string> = {
  win32: "windows",
  linux: "linux",
  darwin: "osx",
};

export async function downloadIgor(
  ctx: Context,
  log: Log,
  cache: Cache,
): Promise<string> {
  const destDir = await cache.getSubDirPath(ctx, "igor");
  const platform = process.platform;
  const arch = process.arch;
  const platformDir = IGOR_PLATFORM_DIRS[platform] ?? platform;
  const exeName = platform === "win32" ? "Igor.exe" : "Igor";
  const igorPath = ctx.path.join(destDir, platformDir, arch, exeName);

  try {
    await ctx.fs.access(igorPath);
    return igorPath;
  } catch {
    // not yet downloaded
  }

  const platformZips = IGOR_ZIPS[platform];
  if (!platformZips) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const url = platformZips[arch];
  if (!url) {
    throw new Error(`Unsupported architecture for ${platform}: ${arch}`);
  }

  // FIXME: fetch should be part of context object
  const response = await fetch(url, {
    headers: { "User-Agent": "gm-cli" },
  });
  if (!response.ok) {
    throw new KnownError(
      `Failed to download Igor: ${response.status} ${response.statusText}`,
    );
  }

  await ctx.fs.mkdir(destDir, { recursive: true });

  const zipPath = ctx.path.join(destDir, "igor.zip");
  const buffer = Buffer.from(await response.arrayBuffer());
  await ctx.fs.writeFile(zipPath, buffer);

  // FIXME: should probably use a cross platform unzip library here instead!
  const unzipOutput = ctx.child_process.execSync(
    `unzip -o ${JSON.stringify(zipPath)} -d ${JSON.stringify(destDir)}`,
    {
      encoding: "utf-8",
    },
  );
  for (const line of unzipOutput.split("\n")) {
    if (line) log.message(line);
  }

  await ctx.fs.unlink(zipPath);

  if (platform !== "win32") {
    await ctx.fs.chmod(igorPath, 0o755);
  }

  return igorPath;
}
