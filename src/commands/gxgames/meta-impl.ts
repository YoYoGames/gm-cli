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
import { readLink } from "./link";
import { createAuthManager } from "./auth";
import { getApiClient } from "./client";
import { Cache } from "~/cache";
import type {
  GameDevUpdateGameRequestAgeRatingEnum,
  GameDevUpdateGameRequestPlatformsEnum,
} from "./api/generated/data-contracts";

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

export default async function (this: Context, flags: MetaFlags): Promise<void> {
  const cache = await Cache.initLazy(this, { type: "infer" });
  const link = await readLink(this, cache);
  const api = getApiClient(this, createAuthManager(this));

  const gameRes = await api.getGameDetails(link.gameId);
  if (!gameRes.success) {
    throw new KnownError(gameRes.errors);
  }
  const game = gameRes.data;

  // --- Metadata ---

  let title: string;
  if (flags.title != null) {
    title = flags.title;
  } else {
    const v = await p.text({ message: "Title", initialValue: game.title });
    if (p.isCancel(v)) {
      return process.exit(0);
    }
    title = v;
  }

  let description: string | undefined;
  if (flags.description != null) {
    description = flags.description || undefined;
  } else {
    const v = await p.text({
      message: "Short description (leave empty to skip)",
      initialValue: game.shortDescription ?? "",
    });
    if (p.isCancel(v)) {
      return process.exit(0);
    }
    description = v || undefined;
  }

  let ageRating: GameDevUpdateGameRequestAgeRatingEnum;
  if (flags.agerating != null) {
    ageRating =
      flags.agerating.toUpperCase() as GameDevUpdateGameRequestAgeRatingEnum;
  } else {
    const v = await p.select({
      message: "Age rating",
      options: AGE_RATING_OPTIONS,
      initialValue: game.ageRating as
        | GameDevUpdateGameRequestAgeRatingEnum
        | undefined,
    });
    if (p.isCancel(v)) {
      return process.exit(0);
    }
    ageRating = v;
  }

  let platforms: GameDevUpdateGameRequestPlatformsEnum[];
  if (flags.platforms != null) {
    platforms = flags.platforms
      .split(",")
      .map(
        (s) => s.trim().toUpperCase() as GameDevUpdateGameRequestPlatformsEnum,
      )
      .filter(Boolean);
  } else {
    const v = await p.multiselect({
      message: "Platforms",
      options: PLATFORM_OPTIONS,
      initialValues: game.platforms as GameDevUpdateGameRequestPlatformsEnum[],
      required: false,
    });
    if (p.isCancel(v)) {
      return process.exit(0);
    }
    platforms = v;
  }

  const updateLog = this.makeTaskLogger("Updating metadata");
  const updateRes = await api.updateGame(link.gameId, {
    title,
    shortDescription: description,
    ageRating,
    platforms,
  });
  if (!updateRes.success) {
    updateLog.error("Failed");
    throw new KnownError(updateRes.errors);
  }
  updateLog.success("Metadata updated");

  // --- Cover ---

  let coverPath: string | undefined;
  if (flags.cover != null) {
    coverPath = flags.cover || undefined;
  } else {
    const v = await p.text({
      message: "Cover image path (16:9 PNG/JPG — leave empty to skip)",
      placeholder: "/path/to/cover.png",
    });
    if (p.isCancel(v)) {
      return process.exit(0);
    }
    coverPath = v || undefined;
  }

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

  let graphicPath: string | undefined;
  if (flags.graphic != null) {
    graphicPath = flags.graphic || undefined;
  } else {
    const v = await p.text({
      message: "Screenshot/graphic path (PNG/JPG — leave empty to skip)",
      placeholder: "/path/to/screenshot.png",
    });
    if (p.isCancel(v)) {
      return process.exit(0);
    }
    graphicPath = v || undefined;
  }

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
