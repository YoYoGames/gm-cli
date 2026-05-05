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

import * as p from "@clack/prompts";
import type { Context } from "~/context";
import { KnownError } from "~/error";
import { createAuthManager } from "./auth";
import { getApiClient } from "./client";
import { unwrapResponse } from "./api/helpers";
import { writeLink } from "./link";
import { Cache } from "~/cache";

export default async function (
  this: Context,
  flags: { studioid?: string; gameid?: string },
): Promise<void> {
  let studioId = flags.studioid;
  let gameId = flags.gameid;

  if (!studioId || !gameId) {
    const api = getApiClient(this, createAuthManager(this));

    if (!studioId) {
      const studiosRes = await unwrapResponse(
        api.getUserStudios({ pageSize: 999 }),
      );
      if (!studiosRes.success) {
        throw new KnownError(studiosRes.errors);
      }

      const selected = await p.select({
        message: "Select a studio",
        options: studiosRes.data.studios.map(({ name, studioId }) => ({
          label: name,
          value: studioId,
        })),
      });
      if (p.isCancel(selected)) {
        return process.exit(0);
      }
      studioId = selected;
    }

    if (!gameId) {
      const gamesRes = await unwrapResponse(
        api.getUserGames({
          studioId: [studioId],
          pageSize: 999,
          gameEngine: ["game-maker"],
        }),
      );
      if (!gamesRes.success) {
        throw new KnownError(gamesRes.errors);
      }

      const selected = await p.select({
        message: "Select a game",
        options: [
          { label: "Create new game", value: "new" as const },
          ...gamesRes.data.games.map(({ title, gameId }) => ({
            label: title,
            value: gameId,
          })),
        ],
      });
      if (p.isCancel(selected)) {
        return process.exit(0);
      }

      if (selected === "new") {
        const gameName = await p.text({ message: "Game name" });
        if (p.isCancel(gameName)) {
          return process.exit(0);
        }
        const createLog = this.makeTaskLogger("Creating game");
        const res = await unwrapResponse(
          api.createGame({
            name: gameName,
            studioId,
            gameEngine: "game-maker",
          }),
        );
        if (!res.success) {
          throw new KnownError(res.errors);
        }
        gameId = res.data.gameId;
        createLog.success(`Game created: ${gameId}`);
      } else {
        gameId = selected;
      }
    }
  }

  const cache = await Cache.initLazy(this, { type: "infer" });
  await writeLink(this, { studioId, gameId }, cache);
  p.log.success(`Linked to studio ${studioId}, game ${gameId}`);
}
