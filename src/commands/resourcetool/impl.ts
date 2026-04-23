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

import { Cache } from "~/cache";
import { type Context } from "~/context";
import { findProjectFile, type ProjectPath } from "~/project";
import {
  downloadGmpm,
  downloadPackageTool,
  downloadProjectTool,
} from "~/gmTools";
import { callResourceTool, type ResourceToolMode } from "~/resourceTool";
import { noopLog } from "~/log";
import { restorePrefabs } from "~/restorePrefabs";

export interface CommonFlags {
  cacheDir?: string;
}

export async function run(
  ctx: Context,
  flags: CommonFlags,
  project: ProjectPath | undefined,
  mode: ResourceToolMode,
): Promise<void> {
  const cwd = ctx.process.cwd();
  const projectPath = project ?? (await findProjectFile(ctx, cwd));

  const cache = new Cache(
    ctx,
    flags.cacheDir
      ? { type: "absolute", path: flags.cacheDir }
      : { type: "infer", projectDir: ctx.path.dirname(projectPath) },
  );
  const projectToolPath = await downloadProjectTool(ctx, cache, noopLog, {
    verbose: false,
  });
  const gmpmPath = await downloadGmpm(ctx, cache, noopLog, {
    verbose: false,
  });
  const packageToolPath = await downloadPackageTool(ctx, cache, noopLog, {
    verbose: false,
  });

  await restorePrefabs(ctx, cache, noopLog, {
    projectToolPath,
    projectPath,
    packageToolPath,
    gmpmPath,
    verbose: false,
  });

  await callResourceTool(ctx, {
    run: mode,
    projectPath,
    projectToolPath,
    prefabsFolder: await cache.getSubDirPath(ctx, "prefabs"),
  });
}
