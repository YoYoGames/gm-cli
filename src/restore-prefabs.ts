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

import type { Cache } from "./cache";
import type { Context } from "./context";
import { KnownError } from "./error";
import type { Log } from "./log";
import type { ProjectPath } from "./project";

export async function restorePrefabs(
  ctx: Context,
  cache: Cache,
  log: Log,
  {
    projectToolPath,
    projectPath,
    packageToolPath,
    gmpmDllPath,
    verbose,
  }: {
    projectToolPath: string;
    projectPath: ProjectPath;
    packageToolPath: string;
    verbose: boolean;
    gmpmDllPath: string;
  },
): Promise<string> {
  const prefabsDir = await cache.getSubDirPath(ctx, "prefabs");
  return new Promise<string>((resolve, reject) => {
    // TODO LATER: add options to pick registry etc.
    const args = [
      "PREFABS",
      "RESTORE",
      `SOURCE=${projectPath}`,
      `PACKAGETOOL=${packageToolPath}`,
      `GMPM_DLL=${gmpmDllPath}`,
      `PACKAGETOOLVERBOSE=${verbose ? "TRUE" : "FALSE"}`,
      `PREFABSFOLDER=${prefabsDir}`,
    ];
    const child = ctx.child_process.spawn(projectToolPath, args, {
      stdio: ["inherit", "pipe", "pipe"],
      env:
        ctx.process.platform === "darwin"
          ? { ...ctx.process.env, COMPlus_ZapDisable: "1" }
          : undefined,
    });

    child.stdout.on("data", (data: Buffer) => {
      for (const line of data.toString().split("\n")) {
        if (line) {
          log.message(line);
        }
      }
    });
    child.stderr.on("data", (data: Buffer) => {
      for (const line of data.toString().split("\n")) {
        if (line) {
          log.message(line);
        }
      }
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0 || code === null) {
        resolve(prefabsDir);
      } else {
        reject(
          new KnownError(
            `Failed to restore project. "ProjectTool PREFABS RESTORE" exited with code ${String(code)}`,
          ),
        );
      }
    });
  });
}
