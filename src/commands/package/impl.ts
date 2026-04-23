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
import { getProjectName, type ProjectPath } from "~/project";
import { packageExtension, type Target } from "~/igor";
import {
  commonCompileSetup,
  type CommonCliBuildFlags,
} from "~/common-compile-setup";
import { constructIgorBuildArgs, spawnIgor } from "~/igor/spawn";
import { stopProcesses } from "~/igor/kill-process";

export default async function (
  this: Context,
  flags: CommonCliBuildFlags & { output?: string },
  project?: ProjectPath,
): Promise<void> {
  await commonCompileSetup(this, flags, project, {
    label: (target) => `Packaging for ${target}`,
    invoke: async (ctx, log, options) => {
      let targetFile: string;
      if (flags.output === undefined) {
        const ext = packageExtension(options.target);
        const projectDir = ctx.path.dirname(options.projectPath);
        const projectName = getProjectName(ctx, options.projectPath);
        const defaultFileName = `${projectName}${ext ?? ""}`;
        targetFile = ctx.path.join(projectDir, defaultFileName);
      } else {
        const projectDir = ctx.path.dirname(options.projectPath);
        targetFile = ctx.path.resolve(projectDir, flags.output);
      }

      const extraArgs = [
        "-tf",
        targetFile,
        // FIXME: make this configurable between "OperaGXPackage_Zip" | "OperaGXPackage_Gamestrip" | "OperaGXPackage_Wallpaper"
        ...(options.target === "operagx"
          ? ["-packagetype", "OperaGXPackage_Zip"]
          : []),
      ];

      await spawnIgor(ctx, log, {
        igorPath: options.igorPath,
        args: constructIgorBuildArgs(
          ctx,
          options,
          getPackageAction(options.target),
          extraArgs,
        ),
        label: "Igor",
        onSignal: () => {
          stopProcesses(ctx);
        },
      });
      return { successMessage: `Package created: ${targetFile}` };
    },
  });
}

function getPackageAction(target: Target): string {
  switch (target) {
    case "windows":
    case "mac":
    case "linux":
      return "PackageZip";
    default:
      return "Package";
    // FIXME: exhaustiveness checking and fix for platforms like xbox: PackageSubmissionXboxOne", PackageSubmissionXboxSeriesXS
  }
}
