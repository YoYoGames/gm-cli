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
import type { ProjectPath } from "~/project";

import { apiUserErrorMessage, LinkStorage } from "../api";
import { createAuthManager } from "../auth";
import { getApiClient } from "../api";
import type {
  GameDevUpdateGameRequest,
  GameDevUpdateGameRequestAgeRatingEnum,
  GameDevUpdateGameRequestPlatformsEnum,
} from "../api/generated/data-contracts";
import type { BaseFlags } from "~/commands/base/base-params";
import { makeTaskLogger } from "~/commands/base/make-task-logger";

interface MetaFlags {
  title?: string;
  ageRating?: GameDevUpdateGameRequestAgeRatingEnum;
  description?: string;
  platforms?: string;
  cover?: string;
  graphic?: string;
}

export default async function (
  this: Context,
  flags: MetaFlags & BaseFlags,
  project?: ProjectPath,
): Promise<void> {
  const projectDir = project ? this.path.dirname(project) : undefined;
  const link = await new LinkStorage(this, projectDir).read();
  const api = getApiClient(this, createAuthManager(this, flags, projectDir));

  const gameRes = await api.getGameDetails(link.gameId);
  if (!gameRes.success) {
    throw new KnownError(apiUserErrorMessage(gameRes.errors));
  }
  const game = gameRes.data;

  // --- Metadata ---
  // Per field: flag overrides server value; otherwise keep server value as-is.

  const updateLog = makeTaskLogger(this, flags)("Updating metadata");
  const updateData: GameDevUpdateGameRequest = {
    title: flags.title ?? game.title,
    shortDescription: flags.description ?? game.shortDescription,
    ageRating: flags.ageRating ?? game.ageRating,
    platforms:
      flags.platforms
        ?.split(",")
        .map(
          (s) =>
            s.trim().toUpperCase() as GameDevUpdateGameRequestPlatformsEnum,
        )
        .filter(Boolean) ??
      (game.platforms as GameDevUpdateGameRequestPlatformsEnum[]),
  };
  const updateRes = await api.updateGame(link.gameId, updateData);
  if (!updateRes.success) {
    if (updateRes.errors.every((e) => e.code === "no_changes")) {
      updateLog.success("Metadata unchanged");
    } else {
      updateLog.error("Failed");
      throw new KnownError(apiUserErrorMessage(updateRes.errors));
    }
  } else {
    updateLog.success("Metadata updated");
  }

  // --- Cover ---

  if (flags.cover) {
    const coverLog = makeTaskLogger(this, flags)("Uploading cover");
    const fileBuffer = await this.fs.readFile(flags.cover);
    const coverRes = await api.uploadCover(
      link.gameId,
      { aspectRatio: "16:9", coverType: "IMAGE" },
      { file: new File([fileBuffer], this.path.basename(flags.cover)) },
    );
    if (!coverRes.success) {
      coverLog.error("Failed");
      throw new KnownError(apiUserErrorMessage(coverRes.errors));
    }
    coverLog.success("Cover uploaded");
  }

  // --- Graphic ---

  if (flags.graphic) {
    const graphicLog = makeTaskLogger(this, flags)("Uploading graphic");
    const fileBuffer = await this.fs.readFile(flags.graphic);
    const graphicRes = await api.uploadGraphic(link.gameId, {
      file: new File([fileBuffer], this.path.basename(flags.graphic)),
    });
    if (!graphicRes.success) {
      graphicLog.error("Failed");
      throw new KnownError(apiUserErrorMessage(graphicRes.errors));
    }
    graphicLog.success("Graphic uploaded");
  }
}
