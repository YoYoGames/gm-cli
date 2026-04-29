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

import type { Context } from "~/context";
import { KnownError } from "~/error";
import { Cache } from "~/cache";
import { z } from "zod";

const STORE_FILENAME = "gxgames.json";

const StoreSchema = z.object({
  auth: z.object({ accessToken: z.string(), expiresAt: z.number() }).optional(),
  link: z.object({ studioId: z.string(), gameId: z.string() }).optional(),
});

type GxGamesStore = z.infer<typeof StoreSchema>;
export type GxGamesLink = NonNullable<GxGamesStore["link"]>;
export type GxGamesAuth = NonNullable<GxGamesStore["auth"]>;

function resolveCacheDir(ctx: Context): string {
  return (
    ctx.process.env["GAMEMAKER_CACHE_DIR"] ??
    ctx.path.join(ctx.process.cwd(), ".gmcache")
  );
}

async function readStore(ctx: Context): Promise<GxGamesStore> {
  const storePath = ctx.path.join(resolveCacheDir(ctx), STORE_FILENAME);
  try {
    const raw = await ctx.fs.readFile(storePath, "utf-8");
    return StoreSchema.parse(JSON.parse(raw));
  } catch {
    return {};
  }
}

async function writeStore(ctx: Context, store: GxGamesStore): Promise<void> {
  const cache = new Cache(ctx, {
    type: "infer",
    projectDir: ctx.process.cwd(),
  });
  const cacheDir = await cache.getLocalPathStrict(ctx);
  if (!cacheDir) {
    throw new KnownError("Failed to initialize cache directory.");
  }
  await ctx.fs.writeFile(
    ctx.path.join(cacheDir, STORE_FILENAME),
    JSON.stringify(store, null, 2),
  );
}

export async function readLink(ctx: Context): Promise<GxGamesLink> {
  const store = await readStore(ctx);
  if (!store.link) {
    throw new KnownError(
      "Game not linked. Run `gm-cli gxgames link --studioid <studio> --gameid <game>` first.",
    );
  }
  return store.link;
}

export async function writeLink(
  ctx: Context,
  link: GxGamesLink,
): Promise<void> {
  const store = await readStore(ctx);
  await writeStore(ctx, { ...store, link });
}

export async function readAuth(ctx: Context): Promise<GxGamesAuth | undefined> {
  const store = await readStore(ctx);
  return store.auth;
}

export async function writeAuth(
  ctx: Context,
  auth: GxGamesAuth,
): Promise<void> {
  const store = await readStore(ctx);
  await writeStore(ctx, { ...store, auth });
}
