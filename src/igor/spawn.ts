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

import path from "path";
import { z } from "zod";
import type { Context } from "~/context";
import type { Log } from "~/log";
import { type Module, type Target } from "./target";
import { getProjectName, type ProjectPath } from "~/project";
import type { Gms2VersionComplete } from "~/toolchain";
import { KnownError } from "~/error";

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
  try {
    const parsed = ErrorsFromIgorSchema.parse(JSON.parse(stderr));
    return parsed.errors
      .filter((error) => error.message)
      .map((error) => ({
        ...error,
        message: unescapeIgorString(error.message),
      }));
  } catch {
    return undefined;
  }
}

export function spawnIgor(
  ctx: Context,
  log: Log,
  {
    igorPath,
    args,
    label,
    onSignal,
  }: {
    igorPath: string;
    args: string[];
    label: string;
    onSignal?: () => void;
  },
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const child = ctx.child_process.spawn(igorPath, args, {
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
      const errors = parseIgorErrors(stderrOutput) ?? [];

      if (errors.length === 0 && (code === 0 || code === null)) {
        resolve();
      } else {
        const errorMessages = errors.map((e) => e.message).join("\n");
        reject(
          new KnownError(
            errorMessages || `${label} exited with code ${String(code)}`,
          ),
        );
      }
    });
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
  { igorPath }: { igorPath: string },
): Promise<Gms2VersionComplete[]> {
  const output = await execIgor(ctx, igorPath, ["Runtime", "List"]);

  const versions: Gms2VersionComplete[] = [];
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
  }: {
    modules?: Module[];
    igorPath: string;
    runtimeDir: string;
    licenseFile: string;
    version?: Gms2VersionComplete;
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
      ...(modules ? ["-m", modules.join(",")] : []),
      ...(version ? [version.join(".")] : []), // FIXME: this won't work for partial versions I don't think!!
    ],
    label: "Igor Runtime Install",
  });
}

export interface CommonIgorBuildArgs {
  igorPath: string;
  licenseFile: string;
  prefabsDir: string;
  runtimeDir: string;
  target: Target;
  cacheDir: string;
  projectPath: ProjectPath;
  projectToolPath: string;
  verbose: boolean;
  runtime: "YYC" | "VM";
}

export function constructIgorBuildArgs(
  ctx: Context,
  commonArgs: CommonIgorBuildArgs,
  action: string,
  extraArgs: string[] = [],
): string[] {
  // Seems like -of argument is ignored on Windows
  const outputFileName =
    ctx.process.platform === "win32"
      ? `${getProjectName(ctx, commonArgs.projectPath)}.win`
      : "outputFile";
  const outputFile = path.join(commonArgs.cacheDir, "output", outputFileName);
  return [
    "-rp",
    commonArgs.runtimeDir,
    "-cache",
    commonArgs.cacheDir,
    "-project",
    commonArgs.projectPath,
    "-runtime",
    commonArgs.runtime,
    "-of",
    outputFile,
    "-lf",
    commonArgs.licenseFile,
    "-prefabs",
    commonArgs.prefabsDir,
    ...(commonArgs.verbose ? ["-v"] : []),
    "-projectool",
    commonArgs.projectToolPath,
    "-jsonErrors",
    ...extraArgs,
    "--",
    commonArgs.target,
    action,
  ];
}
