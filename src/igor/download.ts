import { unzip } from "fflate";
import type { Cache } from "~/cache";
import type { Context } from "~/context";
import { KnownError } from "~/error";
import type { Log } from "~/log";

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
  const platform = ctx.process.platform;
  const arch = ctx.process.arch;
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

  const response = await ctx.fetch(url, {
    headers: { "User-Agent": "gm-cli" },
  });
  if (!response.ok) {
    throw new KnownError(
      `Failed to download Igor: ${String(response.status)} ${response.statusText}`,
    );
  }

  await ctx.fs.mkdir(destDir, { recursive: true });

  const data = new Uint8Array(await response.arrayBuffer());
  const files = await new Promise<Record<string, Uint8Array>>(
    (resolve, reject) => {
      unzip(data, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    },
  );

  for (const [name, content] of Object.entries(files)) {
    if (name.endsWith("/")) continue;
    const outPath = ctx.path.join(destDir, name);
    await ctx.fs.mkdir(ctx.path.dirname(outPath), { recursive: true });
    log.message(`  extracting: ${name}`);
    await ctx.fs.writeFile(outPath, content);
  }

  if (platform !== "win32") {
    await ctx.fs.chmod(igorPath, 0o755);
  }

  return igorPath;
}
