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
import * as p from "@clack/prompts";
import { getApiClient } from "./client";
import { createAuthManager } from "./auth";
import { unwrapResponse } from "./api/helpers";
import { KnownError } from "~/error";
import { readLink } from "./link";
import { Cache } from "~/cache";

export default async function (
  this: Context,
  flags: { version?: string },
  file: string,
): Promise<void> {
  const cache = await Cache.initLazy(this, { type: "infer" });
  const link = await readLink(this, cache);

  const api = getApiClient(this, createAuthManager(this));

  const gamesRes = await unwrapResponse(
    api.getUserGames({
      studioId: [link.studioId],
      pageSize: 999,
      gameEngine: ["game-maker"],
    }),
  );
  if (!gamesRes.success) {
    throw new KnownError(gamesRes.errors);
  }

  const previousVersion = gamesRes.data.games.find(
    (g) => g.gameId === link.gameId,
  )?.version;

  let version: string;
  if (flags.version != null) {
    version = flags.version;
  } else {
    const v = await p.text({
      message: "Version",
      placeholder: "0.0.1.0",
      defaultValue: previousVersion,
    });
    if (p.isCancel(v)) {
      return process.exit(0);
    }
    version = v;
  }

  const uploadLog = this.makeTaskLogger("Uploading bundle");
  const fileBuffer = await this.fs.readFile(file);
  const res = await unwrapResponse(
    api.uploadGameBundle(
      link.gameId,
      { version },
      { file: new File([fileBuffer], this.path.basename(file)) },
    ),
  );
  if (!res.success) {
    throw new KnownError(res.errors);
  }
  uploadLog.success("Bundle uploaded");
  await this.open(`https://dev.gx.games/games/${link.gameId}/publish-updates`);
}
