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
import type { ProjectPath } from "~/project";
import {
  commonCompileSetup,
  type CommonCliBuildFlags,
} from "~/common-compile-setup";
import { stopProcesses } from "~/igor/kill-process";
import { constructIgorBuildArgs, spawnIgor } from "~/igor/spawn";

export default async function (
  this: Context,
  flags: CommonCliBuildFlags,
  project?: ProjectPath,
): Promise<void> {
  await commonCompileSetup(this, flags, project, {
    label: (target) => `Compiling & running for ${target}`,
    invoke: async (ctx, log, args) => {
      await spawnIgor(ctx, log, {
        igorPath: args.igorPath,
        args: constructIgorBuildArgs(ctx, args, "Run"),
        label: "Igor",
        onSignal: () => {
          stopProcesses(ctx);
        },
      });
      return { successMessage: "Game exited" };
    },
  });
}
