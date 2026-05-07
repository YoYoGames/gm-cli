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
import { LINK_CACHE_SUBDIR } from "../config";

const LINK_FILENAME = "link.json";

const LinkSchema = z.object({
  studioId: z.string(),
  gameId: z.string(),
});

export type GxGamesLink = z.infer<typeof LinkSchema>;

export class LinkStorage {
  constructor(
    private readonly ctx: Context,
    private readonly projectDir?: string,
  ) {}

  async read(): Promise<GxGamesLink> {
    const dir = await this.cacheDir();
    try {
      const raw = await this.ctx.fs.readFile(
        this.ctx.path.join(dir, LINK_FILENAME),
        "utf-8",
      );
      return LinkSchema.parse(JSON.parse(raw));
    } catch {
      throw new KnownError(
        "Game not linked. Run `gm-cli gxgames link --studioid <studio> --gameid <game>` first.",
      );
    }
  }

  async write(link: GxGamesLink): Promise<void> {
    // TODO: later, we may want to store this as part of the "manifest" file instead under a "tools.gxgames" key.
    const dir = await this.cacheDir();
    await this.ctx.fs.writeFile(
      this.ctx.path.join(dir, LINK_FILENAME),
      JSON.stringify(link, null, 2),
    );
  }

  private async cacheDir(): Promise<string> {
    const cache = await Cache.initLazy(this.ctx, {
      type: "infer",
      projectDir: this.projectDir,
    });
    return cache.getSubDirPath(this.ctx, LINK_CACHE_SUBDIR);
  }
}
