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

import { z } from "zod";
import type { Context } from "~/context";
import type { Log } from "~/log";
import type { Gms2Version } from "~/toolchain";
import { KnownError } from "~/error";
import { spawnProcess } from "~/spawn";
import type { Module } from "./module";

const RunnerErrorSchema = z.object({
  source: z.literal("Runner"),
  message: z.string(),
  // Additional fields supported by more recent GMS2 runtimes:
  // longMessage: z.string().optional(),
  // script: z.string().optional(),
  // line: z.number().optional(),
  // stacktrace: z.array(z.string()).optional(),
});

const AssetCompilerErrorSchema = z.object({
  source: z.literal("AssetCompiler"),
  message: z.string(),
});

const IgorErrorSchema = z.object({
  source: z.literal("Igor"),
  message: z.string(),
});

const ErrorFromIgorSchema = z.discriminatedUnion("source", [
  RunnerErrorSchema,
  AssetCompilerErrorSchema,
  IgorErrorSchema,
]);

type ErrorFromIgor = z.infer<typeof ErrorFromIgorSchema>;

const ErrorsFromIgorSchema = z.object({
  errors: z.array(ErrorFromIgorSchema),
});

function unescapeIgorString(s: string): string {
  return s.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
}

function parseIgorErrors(stderr: string): ErrorFromIgor[] | undefined {
  const errors = stderr
    .split("\n")
    .flatMap((line) => {
      try {
        return ErrorsFromIgorSchema.parse(JSON.parse(line)).errors;
      } catch {
        return [];
      }
    })
    .filter((error) => error.message)
    .map((error) => ({ ...error, message: unescapeIgorString(error.message) }));

  return errors.length > 0 ? errors : undefined;
}

export function spawnIgor(
  ctx: Context,
  log: Log,
  {
    igorPath,
    args,
    label,
    onSignal,
    verbose,
  }: {
    igorPath: string;
    args: string[];
    label: string;
    onSignal?: () => void;
    verbose?: boolean;
  },
): Promise<void> {
  return spawnProcess(ctx, log, {
    cmd: igorPath,
    args,
    onSignal,
    verbose,
    errorLabel: label,
    parseStderr: (stderr) => {
      const errors = parseIgorErrors(stderr) ?? [];
      const errorMessage = errors.map((e) => e.message).join("\n");
      return { errorMessage, shouldThrow: errors.length > 0 };
    },
  });
}

function execIgor(
  ctx: Context,
  igorPath: string,
  args: string[],
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    ctx.child_process.execFile(
      igorPath,
      args,
      {
        env:
          ctx.process.platform === "darwin"
            ? { ...ctx.process.env, COMPlus_ZapDisable: "1" }
            : undefined,
      },
      (error, stdout, stderr) => {
        if (error) {
          const stderrOutput = stderr?.trim();
          if (stderrOutput) {
            const errors = parseIgorErrors(stderr) ?? [];
            const messages = errors.map((e) => e.message).join("\n");
            if (messages) {
              reject(new KnownError(messages));
              return;
            }
          }
          reject(error as Error);
        } else {
          resolve(stdout);
        }
      },
    );
  });
}

export function fetchLicense(
  ctx: Context,
  log: Log,
  {
    igorPath,
    accessKey,
    outputFile,
  }: {
    igorPath: string;
    accessKey: string;
    outputFile: string;
  },
): Promise<void> {
  return spawnIgor(ctx, log, {
    igorPath,
    args: ["Runtime", "FetchLicense", `-ak=${accessKey}`, `-of=${outputFile}`],
    label: "Igor Runtime FetchLicense",
  });
}

// TODO: Alternatively, we could just read the RSS feed ourselves to avoid relying on Igor
export async function listRuntimes(
  ctx: Context,
  { igorPath, runtimeUrl }: { igorPath: string; runtimeUrl: string },
): Promise<Gms2Version[]> {
  const output = await execIgor(ctx, igorPath, [
    "Runtime",
    "List",
    `-runtimeUrl=${runtimeUrl}`,
  ]);

  const versions: Gms2Version[] = [];
  for (const match of output.matchAll(
    /Version\s+(\d+)\.(\d+)\.(\d+)\.(\d+)/g,
  )) {
    versions.push([
      Number(match[1]),
      Number(match[2]),
      Number(match[3]),
      Number(match[4]),
    ]);
  }
  return versions;
}

// FIXME: should we run Runtime Verify [-folder=.] ?
export function installRuntime(
  ctx: Context,
  log: Log,
  {
    modules,
    igorPath,
    runtimeDir,
    licenseFile,
    version,
    runtimeUrl,
  }: {
    modules?: Module[];
    igorPath: string;
    runtimeDir: string;
    licenseFile: string;
    version?: Gms2Version;
    runtimeUrl: string;
  },
): Promise<void> {
  return spawnIgor(ctx, log, {
    igorPath,
    args: [
      "Runtime",
      "Install",
      "-lf",
      licenseFile,
      "-rp",
      runtimeDir,
      `-runtimeUrl=${runtimeUrl}`,
      ...(modules ? ["-m", modules.join(",")] : []),
      ...(version ? [version.join(".")] : []),
    ],
    label: "Igor Runtime Install",
  });
}
