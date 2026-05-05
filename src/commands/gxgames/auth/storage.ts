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
import { Cache } from "~/cache";
import { z } from "zod";
import { CACHE_SUBDIR } from "../config";

const AUTH_FILENAME = "auth.json";

const AuthSchema = z.object({
  accessToken: z.string(),
  expiresAt: z.number(),
  refreshToken: z.string().optional(),
});

export type GxGamesAuth = z.infer<typeof AuthSchema>;

export class AuthStorage {
  constructor(private readonly ctx: Context) {}

  async read(): Promise<GxGamesAuth | undefined> {
    const cache = await Cache.initLazy(this.ctx, { type: "infer" });
    const dir = await cache.getSubDirPath(this.ctx, CACHE_SUBDIR, {
      preferShared: true,
    });
    try {
      const raw = await this.ctx.fs.readFile(
        this.ctx.path.join(dir, AUTH_FILENAME),
        "utf-8",
      );
      return AuthSchema.parse(JSON.parse(raw));
    } catch {
      return undefined;
    }
  }

  async write(auth: GxGamesAuth): Promise<void> {
    const cache = await Cache.initLazy(this.ctx, { type: "infer" });
    const dir = await cache.getSubDirPath(this.ctx, CACHE_SUBDIR, {
      preferShared: true,
    });
    await this.ctx.fs.writeFile(
      this.ctx.path.join(dir, AUTH_FILENAME),
      JSON.stringify(auth, null, 2),
    );
  }
}
