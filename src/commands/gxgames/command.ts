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

const gxgamesLinkCommand = buildCommand({
  loader: async () => import("./link-impl"),
  parameters: {
    positional: { kind: "tuple", parameters: [] },
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
  loader: async () => import("./upload-impl"),
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "File",
          placeholder: "file",
          parse: String,
        },
      ],
    },
  },
  docs: {
    brief: "Upload to GX.Games",
  },
});

const gxgamesMetaCommand = buildCommand({
  loader: async () => import("./meta-impl"),
  parameters: {
    positional: { kind: "tuple", parameters: [] },
  },
  docs: {
    brief: "Update GX.Games metadata",
  },
});

const gxgamesPublishCommand = buildCommand({
  loader: async () => import("./publish-impl"),
  parameters: {
    positional: { kind: "tuple", parameters: [] },
  },
  docs: {
    brief: "Publish to GX.Games",
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
