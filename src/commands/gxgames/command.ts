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

import { buildCommand, buildRouteMap } from "@stricli/core";
import { parseProjectPath } from "~/project";

const projectParam = {
  brief: "Path to the project .yyp file (defaults to current directory)",
  placeholder: "project",
  parse: parseProjectPath,
  optional: true as const,
};

const gxgamesLinkCommand = buildCommand({
  loader: async () => import("./commands/link-impl"),
  parameters: {
    positional: { kind: "tuple", parameters: [projectParam] },
    flags: {
      studioid: {
        kind: "parsed",
        parse: String,
        brief: "Studio ID",
        optional: true,
      },
      gameid: {
        kind: "parsed",
        parse: String,
        brief: "Game ID",
        optional: true,
      },
    },
  },
  docs: {
    brief: "Link to a GX.Games studio and game",
  },
});

const gxgamesUploadCommand = buildCommand({
  loader: async () => import("./commands/upload-impl"),
  parameters: {
    positional: { kind: "tuple", parameters: [projectParam] },
    flags: {
      file: {
        kind: "parsed",
        parse: String,
        brief: "Path to the zip file to upload",
      },
      version: {
        kind: "parsed",
        parse: String,
        brief: "Version in X.Y.Z.B format (e.g. 1.0.0.0)",
        optional: true,
      },
    },
  },
  docs: {
    brief: "Upload a game bundle to GX.Games",
    fullDescription:
      "Uploads a zip bundle to GX.Games. " +
      "Produce the zip with `gm-cli package --target operagx`. " +
      "Prompts for the version number if --version is not provided.",
  },
});

const gxgamesMetaCommand = buildCommand({
  loader: async () => import("./commands/meta-impl"),
  parameters: {
    positional: { kind: "tuple", parameters: [projectParam] },
    flags: {
      title: {
        kind: "parsed",
        parse: String,
        brief: "Game title",
        optional: true,
      },
      ageRating: {
        kind: "enum",
        values: [
          "NOT_SET",
          "EVERYONE",
          "CHILDREN",
          "EARLY_TEENS",
          "TEENS",
          "ADULTS",
          "MATURE",
        ],
        brief: "Age rating",
        optional: true,
      },
      description: {
        kind: "parsed",
        parse: String,
        brief: "Short description shown on the game page",
        optional: true,
      },
      platforms: {
        kind: "parsed",
        parse: String,
        brief: "Comma-separated platforms: DESKTOP,MOBILE",
        optional: true,
      },
      cover: {
        kind: "parsed",
        parse: String,
        brief:
          "Path to a 16:9 cover image, exact ratio required (e.g. 1920x1080 PNG/JPG)",
        optional: true,
      },
      graphic: {
        kind: "parsed",
        parse: String,
        brief:
          "Path to a 16:9 screenshot/graphic, exact ratio required (e.g. 1920x1080 PNG/JPG)",
        optional: true,
      },
    },
  },
  docs: {
    brief: "Set or update game metadata required for publishing",
    fullDescription:
      "Set or update metadata for your GX.Games game. " +
      "Each flag overrides the corresponding field; omitted flags keep their current server value.",
  },
});

const gxgamesPublishCommand = buildCommand({
  loader: async () => import("./commands/publish-impl"),
  parameters: {
    positional: { kind: "tuple", parameters: [projectParam] },
  },
  docs: {
    brief: "Make the game public on GX.Games",
    fullDescription:
      "Publishes the game by promoting the internal release to public. " +
      "Requires a bundle (upload), cover image, screenshot, description, age rating, and platforms to be set. " +
      "Opens the published game page in the browser on success.",
  },
});

export const gxgamesCommand = buildRouteMap({
  routes: {
    link: gxgamesLinkCommand,
    upload: gxgamesUploadCommand,
    meta: gxgamesMetaCommand,
    publish: gxgamesPublishCommand,
  },
  docs: {
    brief: "GX.Games commands",
  },
});
