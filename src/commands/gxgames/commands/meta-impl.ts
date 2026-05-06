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
import { KnownError } from "~/error";

import { LinkStorage } from "../api";
import { createAuthManager } from "../auth";
import { getApiClient } from "../api";
import type {
  GameDevUpdateGameRequest,
  GameDevUpdateGameRequestAgeRatingEnum,
  GameDevUpdateGameRequestPlatformsEnum,
} from "../api/generated/data-contracts";

const AGE_RATING_OPTIONS: {
  value: GameDevUpdateGameRequestAgeRatingEnum;
  label: string;
}[] = [
  { value: "NOT_SET", label: "Not set" },
  { value: "EVERYONE", label: "Everyone" },
  { value: "CHILDREN", label: "Children" },
  { value: "EARLY_TEENS", label: "Early teens (10+)" },
  { value: "TEENS", label: "Teens (13+)" },
  { value: "ADULTS", label: "Adults (18+)" },
  { value: "MATURE", label: "Mature (21+)" },
];

const PLATFORM_OPTIONS: {
  value: GameDevUpdateGameRequestPlatformsEnum;
  label: string;
}[] = [
  { value: "DESKTOP", label: "Desktop" },
  { value: "MOBILE", label: "Mobile" },
];

interface MetaFlags {
  title?: string;
  agerating?: string;
  description?: string;
  platforms?: string;
  cover?: string;
  graphic?: string;
}

async function prompt<T>(promise: Promise<T | symbol>): Promise<T> {
  const v = await promise;
  if (p.isCancel(v)) {
    process.exit(0);
  }
  return v as T;
}

export default async function (this: Context, flags: MetaFlags): Promise<void> {
  const link = await new LinkStorage(this).read();
  const api = getApiClient(this, createAuthManager(this));

  const gameRes = await api.getGameDetails(link.gameId);
  if (!gameRes.success) {
    throw new KnownError(gameRes.errors);
  }
  const game = gameRes.data;

  // --- Metadata ---
  // Per field: flag → server value → interactive prompt.

  const updateLog = this.makeTaskLogger("Updating metadata");
  const updateData: GameDevUpdateGameRequest = {
    title: await (async () =>
      (flags.title ?? game.title) ||
      (await prompt(p.text({ message: "Title" }))))(),
    shortDescription: await (async () =>
      (flags.description ?? game.shortDescription) ||
      (await prompt(
        p.text({ message: "Short description (leave empty to skip)" }),
      )) ||
      undefined)(),
    ageRating: await (async () =>
      (flags.agerating?.toUpperCase() as
        | GameDevUpdateGameRequestAgeRatingEnum
        | undefined) ??
      (game.ageRating && game.ageRating !== "NOT_SET"
        ? (game.ageRating as GameDevUpdateGameRequestAgeRatingEnum)
        : await prompt(
            p.select({ message: "Age rating", options: AGE_RATING_OPTIONS }),
          )))(),
    platforms: await (async () =>
      flags.platforms
        ?.split(",")
        .map(
          (s) =>
            s.trim().toUpperCase() as GameDevUpdateGameRequestPlatformsEnum,
        )
        .filter(Boolean) ??
      ((game.platforms?.length ?? 0) > 0
        ? (game.platforms as GameDevUpdateGameRequestPlatformsEnum[])
        : await prompt(
            p.multiselect({
              message: "Platforms",
              options: PLATFORM_OPTIONS,
              required: false,
            }),
          )))(),
  };
  const updateRes = await api.updateGame(link.gameId, updateData);
  if (!updateRes.success) {
    if (updateRes.errors.every((e) => e.code === "no_changes")) {
      updateLog.success("Metadata unchanged");
    } else {
      updateLog.error("Failed");
      throw new KnownError(updateRes.errors);
    }
  } else {
    updateLog.success("Metadata updated");
  }

  // --- Cover ---

  const coverPath: string | undefined = await (async () =>
    flags.cover ??
    ((game.covers?.length ?? 0) > 0
      ? undefined
      : (await prompt(
          p.text({
            message: "Cover image path (16:9 PNG/JPG — leave empty to skip)",
            placeholder: "/path/to/cover.png",
          }),
        )) || undefined))();

  if (coverPath) {
    const coverLog = this.makeTaskLogger("Uploading cover");
    const fileBuffer = await this.fs.readFile(coverPath);
    const coverRes = await api.uploadCover(
      link.gameId,
      { aspectRatio: "16:9", coverType: "IMAGE" },
      { file: new File([fileBuffer], this.path.basename(coverPath)) },
    );
    if (!coverRes.success) {
      coverLog.error("Failed");
      throw new KnownError(coverRes.errors);
    }
    coverLog.success("Cover uploaded");
  }

  // --- Graphic ---

  const graphicPath: string | undefined = await (async () =>
    flags.graphic ??
    ((game.graphics?.length ?? 0) > 0
      ? undefined
      : (await prompt(
          p.text({
            message: "Screenshot/graphic path (PNG/JPG — leave empty to skip)",
            placeholder: "/path/to/screenshot.png",
          }),
        )) || undefined))();

  if (graphicPath) {
    const graphicLog = this.makeTaskLogger("Uploading graphic");
    const fileBuffer = await this.fs.readFile(graphicPath);
    const graphicRes = await api.uploadGraphic(link.gameId, {
      file: new File([fileBuffer], this.path.basename(graphicPath)),
    });
    if (!graphicRes.success) {
      graphicLog.error("Failed");
      throw new KnownError(graphicRes.errors);
    }
    graphicLog.success("Graphic uploaded");
  }
}
