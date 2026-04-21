import type { Context } from "~/context";
import * as p from "@clack/prompts";
import { getApiClient } from "./client";
import { authenticate } from "./auth";

// TODO: A lot will change here when we have the new api. I think.
// Right now we're just very limited in what we can do
export default async function (
  ctx: Context,
  _flags: Record<never, never>,
  file: string,
): Promise<void> {
  const token = await authenticate(ctx);
  const api = getApiClient(ctx, token);

  const studiosRes = await api.gamedev.getUserStudios({ pageSize: 999 });

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

  const gamesRes = await api.gamedev.getUserGames({
    studioId: [studioId],
    pageSize: 999,
    gameEngine: ["game-maker"],
  });

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
    const res = await api.gamedev.createGame({
      name: gameName,
      studioId,
      gameEngine: "game-maker",
    });
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
  await api.gamedev.uploadGameBundle(
    gameId,
    { version },
    { file: new File([fileBuffer], ctx.path.basename(file)) },
  );
  uploadLog.success("Bundle uploaded");
  await ctx.open(`https://dev.gx.games/games/${gameId}/details`);
}
