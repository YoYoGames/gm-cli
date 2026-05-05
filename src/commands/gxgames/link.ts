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
const CACHE_SUBDIR = "gxgames";

const StoreSchema = z.object({
  auth: z.object({ accessToken: z.string(), expiresAt: z.number() }).optional(),
  link: z.object({ studioId: z.string(), gameId: z.string() }).optional(),
});

type GxGamesStore = z.infer<typeof StoreSchema>;
export type GxGamesLink = NonNullable<GxGamesStore["link"]>;
export type GxGamesAuth = NonNullable<GxGamesStore["auth"]>;

async function readStore(ctx: Context, cache: Cache): Promise<GxGamesStore> {
  const dir = await cache.getSubDirPath(ctx, CACHE_SUBDIR);
  const storePath = ctx.path.join(dir, STORE_FILENAME);
  try {
    const raw = await ctx.fs.readFile(storePath, "utf-8");
    return StoreSchema.parse(JSON.parse(raw));
  } catch {
    return {};
  }
}

async function writeStore(
  ctx: Context,
  store: GxGamesStore,
  cache: Cache,
): Promise<void> {
  // TODO: later, we may want to store this as part of the "manifest" file instead under a "tools.gxgames" key.
  const dir = await cache.getSubDirPath(ctx, CACHE_SUBDIR);
  const storePath = ctx.path.join(dir, STORE_FILENAME);
  await ctx.fs.writeFile(storePath, JSON.stringify(store, null, 2));
}

export async function readLink(
  ctx: Context,
  cache: Cache,
): Promise<GxGamesLink> {
  const store = await readStore(ctx, cache);
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
  cache: Cache,
): Promise<void> {
  const store = await readStore(ctx, cache);
  await writeStore(ctx, { ...store, link }, cache);
}

export async function readAuth(
  ctx: Context,
  cache: Cache,
): Promise<GxGamesAuth | undefined> {
  const store = await readStore(ctx, cache);
  return store.auth;
}

export async function writeAuth(
  ctx: Context,
  auth: GxGamesAuth,
  cache: Cache,
): Promise<void> {
  const store = await readStore(ctx, cache);
  await writeStore(ctx, { ...store, auth }, cache);
}
