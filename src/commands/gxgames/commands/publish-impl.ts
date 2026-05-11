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
import chalk from "chalk";
import { KnownError } from "~/error";
import type { ProjectPath } from "~/project";

import { apiUserErrorMessage, LinkStorage } from "../api";
import { createAuthManager } from "../auth";
import { getApiClient } from "../api";
import type { BaseFlags } from "~/commands/base/base-params";
import { makeTaskLogger } from "~/commands/base/make-task-logger";

export default async function (
  this: Context,
  flags: BaseFlags,
  project?: ProjectPath,
): Promise<void> {
  const projectDir = project ? this.path.dirname(project) : undefined;
  const link = await new LinkStorage(this, projectDir).read();
  const api = getApiClient(this, createAuthManager(this, flags, projectDir));

  const publishLog = makeTaskLogger(this, flags)("Publishing game");
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
    throw new KnownError(apiUserErrorMessage(res.errors));
  }

  publishLog.success("Game published!");

  const url = `https://gx.games/games/${link.gameId}`;
  await this.open(url);
  this.process.stdout.write(`Opening ${chalk.blue.underline(url)}\n`);
}
