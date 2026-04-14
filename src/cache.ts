import type { Context } from "./context";
import { exists } from "./context";
import { version } from "../package.json";
import { z } from "zod";
import { KnownError } from "./error";

export type CacheType = "absolute" | "infer" | "temporary";

export class Cache {
  private _path: string;
  private _cacheType: CacheType;

  private constructor(path: string, cacheType: CacheType) {
    this._path = path;
    this._cacheType = cacheType;
  }

  static async getOrInit(
    ctx: Context,
    path:
      | { type: "absolute"; path: string }
      | { type: "infer"; projectDir: string }
      | { type: "temporary" },
  ): Promise<Cache> {
    let cachePath: string;
    if (path.type === "absolute") {
      cachePath = path.path;
    } else if (
      path.type === "infer" &&
      ctx.process.env["GAMEMAKER_CACHE_DIR"]
    ) {
      cachePath = ctx.process.env["GAMEMAKER_CACHE_DIR"];
    } else if (path.type === "infer") {
      cachePath = ctx.path.join(path.projectDir, ".gmcache");
    } else if (path.type === "temporary") {
      cachePath = ctx.path.join(ctx.os.tmpdir(), "gm-cli-cache");
    } else {
      path satisfies never;
      throw new Error("unreachable");
    }

    const metaPath = ctx.path.join(cachePath, META_FILENAME);

    if (await exists(ctx, metaPath)) {
      const rawMetaFile = await ctx.fs.readFile(metaPath, "utf-8");
      const meta = CacheMetaSchema.safeParse(JSON.parse(rawMetaFile));

      // If there is an existing meta file, check and see if it's of a compatible version
      if (!meta.success || !isCompatibleVersion(meta.data.version, version)) {
        // If not, it's fine to remove the contents
        await ctx.fs.rm(cachePath, { recursive: true });
        await createCacheDir(ctx, cachePath);
      }
    } else if (
      // Fine to create cache dir if the directory is empty or does not exist yet
      !(await exists(ctx, cachePath)) ||
      (await ctx.fs.readdir(cachePath)).length === 0
    ) {
      await createCacheDir(ctx, cachePath);
    } else {
      // However, we don't dare deleting files in a pre-existing directory that does not seem to have been used
      // as a cache. We want to avoid deleting the users files.
      throw new KnownError(
        `The path '${cachePath}' already exists but it's not a cache directory!\nAre you sure you want to use this directory as a cache? If so, manually delete its content.`,
      );
    }

    return new Cache(cachePath, path.type);
  }

  get dirPath(): string {
    return this._path;
  }

  get cacheType(): CacheType {
    return this._cacheType;
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
  await ctx.fs.mkdir(cachePath, { recursive: true });
  await ctx.fs.writeFile(
    ctx.path.join(cachePath, META_FILENAME),
    JSON.stringify({ version }, null, 2),
  );
  await ctx.fs.writeFile(ctx.path.join(cachePath, ".gitignore"), "*\n");
}
