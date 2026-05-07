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
import { AUTH_CACHE_SUBDIR } from "../config";

const AUTH_FILENAME = "auth.json";

const AuthSchema = z.object({
  accessToken: z.string(),
  expiresAt: z.number(),
  refreshToken: z.string().optional(),
});

export type GxGamesAuth = z.infer<typeof AuthSchema>;

export class AuthStorage {
  constructor(
    private readonly ctx: Context,
    private readonly projectDir?: string,
  ) {}

  async read(): Promise<GxGamesAuth | undefined> {
    const dir = await this.cacheDir();
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
    const dir = await this.cacheDir();
    await this.ctx.fs.writeFile(
      this.ctx.path.join(dir, AUTH_FILENAME),
      JSON.stringify(auth, null, 2),
    );
  }

  private async cacheDir(): Promise<string> {
    const cache = await Cache.initLazy(this.ctx, {
      type: "infer",
      projectDir: this.projectDir,
    });
    return cache.getSubDirPath(this.ctx, AUTH_CACHE_SUBDIR, {
      preferShared: true,
    });
  }
}
