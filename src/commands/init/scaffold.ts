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

import { unzip } from "fflate";
import type { Template } from "./types";
import type { Cache } from "~/cache";
import type { Context } from "~/context";
import { KnownError } from "~/error";
import {
  downloadProjectTool,
  downloadGmpm,
  downloadPackageTool,
} from "~/gm-tools";
import { noopLog } from "~/log";
import { findProjectFile } from "~/project";
import { restorePrefabs } from "~/restore-prefabs";

export async function scaffoldProject(
  ctx: Context,
  template: Template & { kind: "download" },
  project: { name: string; dir: string },
  cache: Cache,
) {
  const tempDir = await downloadAndUnpack(ctx, template.downloadUrl);

  // The zip may place files at the top level or inside a single subdirectory.
  const extractedYyp =
    (await findProjectFile(ctx, tempDir)) ??
    (await findProjectFileInSubdirs(ctx, tempDir));

  if (!extractedYyp) {
    await ctx.fs.rm(tempDir, { recursive: true });
    throw new KnownError(
      "Invariant broken: Template archive does not contain a .yyp project file",
    );
  }

  // Install tools
  const projectToolPath = await downloadProjectTool(ctx, cache, noopLog, {
    verbose: false,
  });
  const gmpmPath = await downloadGmpm(ctx, cache, noopLog, { verbose: false });
  const packageToolPath = await downloadPackageTool(ctx, cache, noopLog, {
    verbose: false,
  });

  const prefabsDir = await restorePrefabs(ctx, cache, noopLog, {
    projectToolPath,
    projectPath: extractedYyp,
    packageToolPath,
    gmpmPath,
    verbose: true,
  });

  const destinationYyp = ctx.path.join(project.dir, `${project.name}.yyp`);
  ctx.child_process.execFileSync(
    projectToolPath,
    [
      "PROJECT",
      "SAVE",
      `SOURCE=${extractedYyp}`,
      `DESTINATION=${destinationYyp}`,
      `PREFABSFOLDER=${prefabsDir}`,
    ],
    {
      env:
        ctx.process.platform === "darwin"
          ? { ...ctx.process.env, COMPlus_ZapDisable: "1" }
          : undefined,
    },
  );

  await ctx.fs.rm(tempDir, { recursive: true });
}

async function downloadAndUnpack(ctx: Context, url: string) {
  const response = await ctx.fetch(url);
  if (!response.ok) {
    throw new KnownError(`Failed to download template: ${response.statusText}`);
  }

  const data = new Uint8Array(await response.arrayBuffer());

  const files = await new Promise<Record<string, Uint8Array>>(
    (resolve, reject) => {
      unzip(data, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    },
  );

  const tempDir = await ctx.fs.mkdtemp(
    ctx.path.join(ctx.os.tmpdir(), "gm-scaffold-"),
  );

  for (const [name, content] of Object.entries(files)) {
    if (name.endsWith("/")) {
      continue;
    }
    const outPath = ctx.path.join(tempDir, name);
    await ctx.fs.mkdir(ctx.path.dirname(outPath), { recursive: true });
    await ctx.fs.writeFile(outPath, content);
  }

  return tempDir;
}

async function findProjectFileInSubdirs(ctx: Context, dir: string) {
  const entries = await ctx.fs.readdir(dir);
  for (const entry of entries) {
    const entryPath = ctx.path.join(dir, entry);
    try {
      const found = await findProjectFile(ctx, entryPath);
      if (found) {
        return found;
      }
    } catch {
      // entry is a file, not a directory — skip
    }
  }
  return undefined;
}
