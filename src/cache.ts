import type { Context } from "./context";
import { exists } from "./context";
import { version } from "../package.json";
import { z } from "zod";

export class Cache {
  private _path: string;

  private constructor(path: string) {
    this._path = path;
  }

  static async getOrInit(ctx: Context, path?: string): Promise<Cache> {
    const cachePath = path ?? ctx.path.join(ctx.process.cwd(), ".gmcache");

    const metaPath = ctx.path.join(cachePath, META_FILENAME);

    if (await exists(ctx, metaPath)) {
      const raw = await ctx.fs.readFile(metaPath, "utf-8");
      const meta = CacheMetaSchema.safeParse(JSON.parse(raw));

      if (!meta.success || !isCompatibleVersion(meta.data.version, version)) {
        await createCacheDir(ctx, cachePath);
      }
    } else {
      await createCacheDir(ctx, cachePath);
    }

    return new Cache(cachePath);
  }

  get dirPath(): string {
    return this._path;
  }

  async getSubDirPath(ctx: Context, name: string): Promise<string> {
    const dir = ctx.path.join(this._path, name);
    await ctx.fs.mkdir(dir, { recursive: true });
    return dir;
  }
}

const CacheMetaSchema = z.object({ version: z.string() });

const META_FILENAME = "cache.meta.json";

function isCompatibleVersion(cached: string, current: string): boolean {
  const [cachedMajor, cachedMinor] = cached.split(".").map(Number);
  const [currentMajor, currentMinor] = current.split(".").map(Number);

  if (currentMajor === 0) {
    // For 0.*.* versions, every minor version breaks compatibility
    return cachedMajor === currentMajor && cachedMinor === currentMinor;
  }

  // For >=1.*.* versions, major versions break compatibility
  return cachedMajor === currentMajor;
}

async function createCacheDir(ctx: Context, cachePath: string): Promise<void> {
  if (await exists(ctx, cachePath)) {
    // FIXME: this can be pretty dangerous, since the user can provide a custom cache path
    await ctx.fs.rm(cachePath, { recursive: true });
  }
  await ctx.fs.mkdir(cachePath, { recursive: true });
  await ctx.fs.writeFile(
    ctx.path.join(cachePath, META_FILENAME),
    JSON.stringify({ version }, null, 2),
  );
}
