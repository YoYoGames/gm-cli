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
import { KnownError } from "~/error";
import type { Log } from "~/log";

export async function spawnGmrt(
  ctx: Context,
  log: Log,
  {
    gmrtPath,
    args,
    onSignal,
  }: { gmrtPath: string; args: string[]; onSignal?: () => void },
) {
  return new Promise<void>((resolve, reject) => {
    const child = ctx.child_process.spawn(gmrtPath, args, {
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

    // Stderr is assumed to only contain a JSON object and nothing else,
    // so we collect the output and parse it on close.
    const stderrChunks: Buffer[] = [];
    child.stderr.on("data", (data: Buffer) => {
      stderrChunks.push(Buffer.from(data));
      for (const line of data.toString().split("\n")) {
        if (line) {
          // FIXME: improve this! Our logger should support multiple lines of stderr output
          log.message("stderr: " + line);
        }
      }
    });

    if (onSignal) {
      ctx.process.on("SIGINT", onSignal);
      ctx.process.on("SIGTERM", onSignal);
    }

    child.on("error", (err) => {
      if (onSignal) {
        ctx.process.removeListener("SIGINT", onSignal);
        ctx.process.removeListener("SIGTERM", onSignal);
      }
      reject(err);
    });

    child.on("close", (code) => {
      if (onSignal) {
        ctx.process.removeListener("SIGINT", onSignal);
        ctx.process.removeListener("SIGTERM", onSignal);
      }

      const stderrOutput = Buffer.concat(stderrChunks).toString().trim();
      if (!stderrOutput && (code === 0 || code === null)) {
        resolve();
      } else {
        reject(
          new KnownError(
            stderrOutput || `gmrt exited with code ${String(code)}`,
          ),
        );
      }
    });
  });
}
