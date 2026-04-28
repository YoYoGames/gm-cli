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
import { authenticate } from "./auth";
import { unwrapResponse } from "./api/helpers";
import { KnownError } from "~/error";

// TODO: A lot will change here when we have the new api. I think.
// Right now we're just very limited in what we can do
export default async function (
  ctx: Context,
  _flags: Record<never, never>,
  file: string,
): Promise<void> {
  const token = await authenticate(ctx);
  const api = getApiClient(ctx, token);

  const studiosRes = await unwrapResponse(
    api.getUserStudios({ pageSize: 999 }),
  );
  if (!studiosRes.success) {
    throw new KnownError(studiosRes.errors);
  }

  const studioId = await p.select({
    message: "Select a studio",
    options: studiosRes.data.studios.map(({ name, studioId }) => ({
      label: name,
      value: studioId,
    })),
  });
  if (p.isCancel(studioId)) {
    return process.exit(0);
  }

  const gamesRes = await unwrapResponse(
    api.getUserGames({
      studioId: [studioId],
      pageSize: 999,
      gameEngine: ["game-maker"],
    }),
  );
  if (!gamesRes.success) {
    throw new KnownError(studiosRes.errors);
  }

  const gameChoice = await p.select({
    message: "Create a new game or upload to an existing one?",
    options: [
      { label: "Create new game", value: "new" as const },
      ...gamesRes.data.games.map(({ title, gameId, version }) => ({
        label: `${title} (current: ${version})`,
        value: gameId,
      })),
    ],
  });
  if (p.isCancel(gameChoice)) {
    return process.exit(0);
  }

  let gameId: string;
  let previousVersion: string | undefined;

  if (gameChoice === "new") {
    const gameName = await p.text({
      message: "Game name",
    });
    if (p.isCancel(gameName)) {
      return process.exit(0);
    }

    const createLog = ctx.makeTaskLogger("Creating game");
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
    gameId = gameChoice;
    previousVersion = gamesRes.data.games.find(
      (g) => g.gameId === gameId,
    )?.version;
  }

  const version = await p.text({
    message: "Version",
    placeholder: "0.0.1.0",
    defaultValue: previousVersion,
  });
  if (p.isCancel(version)) {
    return process.exit(0);
  }

  const uploadLog = ctx.makeTaskLogger("Uploading bundle");
  const fileBuffer = await ctx.fs.readFile(file);
  const res = await unwrapResponse(
    api.uploadGameBundle(
      gameId,
      { version },
      { file: new File([fileBuffer], ctx.path.basename(file)) },
    ),
  );
  if (!res.success) {
    throw new KnownError(res.errors);
  }
  uploadLog.success("Bundle uploaded");
  await ctx.open(`https://dev.gx.games/games/${gameId}/details`);
}
