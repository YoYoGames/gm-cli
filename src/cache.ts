/**
 * Copyright 2026, Opera Norway AS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at:
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Context } from "./context";
import { exists } from "./context";

import { version } from "../package.json";
import { z } from "zod";
import semver from "semver";
import { KnownError } from "./error";
import { findProjectFile } from "./project";

/** The subset of the Context object that's used in the cache.
 * Needed because we make use of the cache in app.ts before the context object is constructed
 */
type CacheCtx = Pick<Context, "path" | "fs" | "os" | "process" | "env">;

export type CacheType =
  /** Use a caller-specified absolute path as the local cache directory. Disables the shared cache. */
  | { type: "absolute"; path: string }
  /**
   * Infer the cache directory from GAMEMAKER_CLI_CACHE_DIR or current working dir.
   * Shared cache is allowed unless GAMEMAKER_CLI_CACHE_DIR or CI env vars are set. projectDir can be set if
   * the project is not in the working directory.
   */
  | { type: "infer"; projectDir?: string }
  /** Use a throwaway directory under the OS temp dir. Disables the shared cache. */
  | { type: "temporary" }
  /** Skip the local cache entirely and use only the shared system-wide cache. */
  | { type: "shared-only" };

export class Cache {
  private _sharedPath:
    | {
        type: "not-allowed";
      }
    | {
        type: "initialized";
        path: string;
      }
    | {
        type: "not-initialized";
        intendedPath: string;
      };

  private _localPath:
    | {
        type: "initialized";
        path: string;
      }
    | {
        type: "not-initialized";
        intendedPath: string;
      }
    | { type: "not-allowed" };

  static async initLazy(ctx: CacheCtx, cacheType: CacheType): Promise<Cache> {
    const { path: localPath, allowShared } = await resolveLocalCachePath(
      ctx,
      cacheType,
    );
    return new Cache(
      localPath,
      allowShared ? resolveSharedCachePath(ctx) : undefined,
    );
  }

  private constructor(
    localPath: string | undefined,
    sharedPath: string | undefined,
  ) {
    if (localPath) {
      this._localPath = { type: "not-initialized", intendedPath: localPath };
    } else {
      this._localPath = { type: "not-allowed" };
    }
    if (sharedPath) {
      this._sharedPath = { type: "not-initialized", intendedPath: sharedPath };
    } else {
      this._sharedPath = { type: "not-allowed" };
    }
  }

  private async initCachePath(ctx: CacheCtx, cachePath: string): Promise<void> {
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
  }

  private async initLocal(ctx: CacheCtx): Promise<boolean> {
    if (this._localPath.type === "initialized") {
      return true;
    }
    if (this._localPath.type === "not-allowed") {
      return false;
    }
    const path = this._localPath.intendedPath;
    await this.initCachePath(ctx, path);
    this._localPath = { type: "initialized", path };
    return true;
  }

  private async initShared(ctx: CacheCtx): Promise<boolean> {
    if (this._sharedPath.type === "initialized") {
      return true;
    }
    if (this._sharedPath.type === "not-allowed") {
      return false;
    }

    const cachePath = resolveSharedCachePath(ctx);
    await this.initCachePath(ctx, cachePath);
    this._sharedPath = { type: "initialized", path: cachePath };
    return true;
  }

  /** Initializes and returns the local path, or undefined if local access is not allowed for this cache type. */
  public async _getInternalLocalPath(
    ctx: CacheCtx,
  ): Promise<string | undefined> {
    if (!(await this.initLocal(ctx))) {
      // Not allowed to use shared cache
      return undefined;
    }
    if (this._localPath.type !== "initialized") {
      throw new Error("Unreachable: local cache should be initialized");
    }
    return this._localPath.path;
  }

  /** Initializes and returns the shared path, or undefined if shared access is not allowed for this cache. */
  public async _getInternalSharedPath(
    ctx: CacheCtx,
  ): Promise<string | undefined> {
    if (!(await this.initShared(ctx))) {
      // Not allowed to use shared cache
      return undefined;
    }
    if (this._sharedPath.type !== "initialized") {
      throw new Error("Unreachable: shared cache should be initialized");
    }
    return this._sharedPath.path;
  }

  async getSubDirPath(
    ctx: CacheCtx,
    name: string,
    { preferShared }: { preferShared: boolean } = {
      preferShared: false,
    },
  ): Promise<string> {
    if (preferShared && this._sharedPath.type !== "not-allowed") {
      return this.getSubDirPathShared(ctx, name);
    }
    return this.getSubDirPathLocal(ctx, name);
  }

  private async getSubDirPathLocal(
    ctx: CacheCtx,
    name: string,
  ): Promise<string> {
    // lazily create the cache directory if needed
    if (!(await this.initLocal(ctx))) {
      throw new Error(
        "Invariant broken: getSubDirPathLocal should only be called when we know that it's allowed to use a local cache",
      );
    }
    if (this._localPath.type !== "initialized") {
      throw Error("Unreachable: local cache should be initialized.");
    }

    const dir = ctx.path.join(this._localPath.path, name);
    await ctx.fs.mkdir(dir, { recursive: true });
    return dir;
  }

  private async getSubDirPathShared(
    ctx: CacheCtx,
    name: string,
  ): Promise<string> {
    if (!(await this.initShared(ctx))) {
      throw new Error(
        "Invariant broken: getSubDirPathShared should only be called when we know that it's allowed to use a shared cache",
      );
    }
    if (this._sharedPath.type !== "initialized") {
      throw Error("Unreachable: shared cache should be initialized.");
    }

    const dir = ctx.path.join(this._sharedPath.path, name);
    await ctx.fs.mkdir(dir, { recursive: true });
    return dir;
  }
}

/** Resolve the path based on the cache type and decide if we are allowed to
 * used the shared cache as well.
 */
async function resolveLocalCachePath(
  ctx: CacheCtx,
  cacheType: CacheType,
): Promise<{ path?: string; allowShared: boolean }> {
  const isCi = ctx.env.CI;
  if (cacheType.type === "absolute") {
    return { path: cacheType.path, allowShared: false };
  }
  if (cacheType.type === "infer" && ctx.env.GAMEMAKER_CLI_CACHE_DIR) {
    return { path: ctx.env.GAMEMAKER_CLI_CACHE_DIR, allowShared: false };
  }
  if (cacheType.type === "infer" && cacheType.projectDir !== undefined) {
    return {
      path: ctx.path.join(cacheType.projectDir, ".gmcache"),
      allowShared: !isCi,
    };
  }
  // Try using cwd if we can find a .yyp file
  if (cacheType.type === "infer") {
    const cwd = ctx.process.cwd();
    const projectPath = await findProjectFile(ctx, cwd);
    if (projectPath === undefined) {
      throw new KnownError(
        "No .yyp project file found in the current directory",
      );
    }
    return { path: ctx.path.join(cwd, ".gmcache"), allowShared: !isCi };
  }
  if (cacheType.type === "temporary") {
    return {
      path: ctx.path.join(ctx.os.tmpdir(), "gm-cli-cache"),
      allowShared: false,
    };
  }
  if (cacheType.type === "shared-only") {
    if (isCi) {
      throw new Error(
        "Invariant broken: Can't use a shared-only cache in CI since it does not allow shared caches",
      );
    }
    return { path: undefined, allowShared: !isCi };
  }

  cacheType satisfies never;
  throw new Error("unreachable");
}

function resolveSharedCachePath(ctx: CacheCtx): string {
  const home = ctx.os.homedir();
  const platform = ctx.os.platform();

  if (platform === "darwin") {
    return ctx.path.join(home, "Library", "Caches", "GameMakerCLI");
  } else if (platform === "win32") {
    const localAppData =
      ctx.env.LOCALAPPDATA ?? ctx.path.join(home, "AppData", "Local");
    return ctx.path.join(localAppData, "GameMakerCLI", "cache");
  } else {
    // Linux / other — respect XDG_CACHE_HOME
    const xdgCache = ctx.env.XDG_CACHE_HOME ?? ctx.path.join(home, ".cache");
    return ctx.path.join(xdgCache, "GameMakerCLI");
  }
}

const CacheMetaSchema = z.object({ version: z.string() });

const META_FILENAME = "cache.meta.json";

function isCompatibleVersion(cached: string, current: string): boolean {
  if (semver.major(current) === 0) {
    // For 0.*.* versions, every minor version breaks compatibility
    return (
      semver.major(cached) === semver.major(current) &&
      semver.minor(cached) === semver.minor(current)
    );
  }

  // For >=1.*.* versions, major versions break compatibility
  return semver.major(cached) === semver.major(current);
}

async function createCacheDir(ctx: CacheCtx, cachePath: string): Promise<void> {
  await ctx.fs.mkdir(cachePath, { recursive: true });
  await ctx.fs.writeFile(
    ctx.path.join(cachePath, META_FILENAME),
    JSON.stringify({ version }, null, 2),
  );
  await ctx.fs.writeFile(ctx.path.join(cachePath, ".gitignore"), "*\n");
}
