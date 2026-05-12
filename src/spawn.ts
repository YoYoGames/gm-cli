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

import type { Context } from "./context";
import type { Log } from "./log";
import { KnownError } from "./error";

export function spawnProcess(
  ctx: Pick<Context, "child_process" | "process">,
  log: Log,
  {
    cmd,
    args,
    onSignal,
    errorLabel,
    verbose = false,
    parseStderr = (s: string) => ({ errorMessage: s, shouldThrow: false }),
  }: {
    cmd: string;
    args: string[];
    onSignal?: () => void;
    errorLabel: string;
    verbose?: boolean;
    parseStderr?: (stderr: string) => {
      errorMessage: string;
      shouldThrow: boolean;
    };
  },
): Promise<void> {
  if (verbose) {
    log.message([cmd, ...args].join(" "));
  }

  const env =
    ctx.process.platform === "darwin"
      ? { ...ctx.process.env, COMPlus_ZapDisable: "1" }
      : ctx.process.env;

  return new Promise<void>((resolve, reject) => {
    const child = ctx.child_process.spawn(cmd, args, {
      stdio: ["inherit", "pipe", "pipe"],
      env,
    });

    const logLines = (data: Buffer) => {
      for (const line of data.toString().split("\n")) {
        if (line) {
          log.message(line);
        }
      }
    };

    child.stdout.on("data", logLines);

    const stderrChunks: Buffer[] = [];
    child.stderr.on("data", (data: Buffer) => {
      stderrChunks.push(Buffer.from(data));
      logLines(data);
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
      const { errorMessage, shouldThrow } = parseStderr(stderrOutput);

      if (shouldThrow) {
        reject(new KnownError(errorMessage));
      } else if (code === 0 || code === null) {
        resolve();
      } else {
        reject(
          new KnownError(
            errorMessage || `${errorLabel} exited with code ${String(code)}`,
          ),
        );
      }
    });
  });
}
