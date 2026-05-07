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
import type { ProjectPath } from "~/project";

import { LinkStorage } from "../api";
import { createAuthManager } from "../auth";
import { getApiClient } from "../api";

export default async function (
  this: Context,
  _flags: Record<never, never>,
  project?: ProjectPath,
): Promise<void> {
  const projectDir = project ? this.path.dirname(project) : undefined;
  const link = await new LinkStorage(this, projectDir).read();
  const api = getApiClient(this, createAuthManager(this, projectDir));

  const publishLog = this.makeTaskLogger("Publishing game");
  const res = await api.publishGame(link.gameId);

  if (!res.success) {
    publishLog.error("Publish failed");
    if (res.errors.some((e) => e.code === "sign_up_not_completed")) {
      throw new KnownError(
        new Error(
          "Finish onboarding at https://dev.gx.games/ before publishing.",
        ),
      );
    }
    throw new KnownError(res.errors);
  }

  publishLog.success("Game published!");
  p.log.info(`Opening game page...`);
  await this.open(`https://gx.games/games/${link.gameId}`);
}
