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

import type { Template } from "./types";
import type { Cache } from "~/cache";
import type { Context } from "~/context";
import { KnownError } from "~/error";
import { downloadProjectTool } from "~/gmTools";
import { noopLog } from "~/log";

export async function scaffoldProject(
  ctx: Context,
  template: Template & { kind: "download" },
  project: { name: string; dir: string },
  cache: Cache,
) {
  const response = await ctx.fetch(template.downloadUrl);
  if (!response.ok) {
    throw new KnownError(`Failed to download template: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();

  const archivePath = project.dir + ".zip";
  await ctx.fs.writeFile(archivePath, Buffer.from(buffer));

  const projectToolPath = await downloadProjectTool(ctx, cache, noopLog, {
    verbose: false,
  });

  const destinationYyp = ctx.path.join(project.dir, `${project.name}.yyp`);
  ctx.child_process.execFileSync(
    projectToolPath,
    [
      "PROJECT",
      "SAVE",
      `SOURCE=${archivePath}`,
      `DESTINATION=${destinationYyp}`,
    ],
    {
      env:
        ctx.process.platform === "darwin"
          ? { ...ctx.process.env, COMPlus_ZapDisable: "1" }
          : undefined,
    },
  );

  await ctx.fs.unlink(archivePath);
}
