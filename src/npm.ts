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

import { promisify } from "node:util";
import type { Context } from "./context";
import type { Log } from "./log";

export interface PlatformSuffixes {
  win32: { x64: string; arm64: string };
  linux: { x64: string; arm64: string };
  darwin: { x64: string; arm64: string };
}

const DEFAULT_PLATFORM_SUFFIXES: PlatformSuffixes = {
  win32: {
    x64: "win-x64",
    // No arm64-specific Windows builds exist, so we fall back to x64 via emulation
    arm64: "win-x64",
  },
  linux: {
    x64: "linux-x64",
    arm64: "linux-arm64",
  },
  darwin: {
    x64: "osx-x64",
    arm64: "osx-arm64",
  },
};

export function getPlatformSuffix(
  ctx: Context,
  overrides?: { [K in keyof PlatformSuffixes]?: Partial<PlatformSuffixes[K]> },
): string {
  const platform = ctx.process.platform as keyof PlatformSuffixes;
  const arch = ctx.process.arch;

  const platformNames = {
    ...DEFAULT_PLATFORM_SUFFIXES[platform],
    ...overrides?.[platform],
  };

  const suffix = (platformNames as Record<string, string>)[arch];
  if (!suffix) {
    throw new Error(`Unsupported platform/arch: ${platform}/${arch}`);
  }

  return suffix;
}

export const REGISTRY = "https://gmpm.gamemaker.io";
export const PRIVATE_REGISTRY = "https://gmpm-private.gamemaker.io";

function cmd(
  ctx: Pick<Context, "process">,
  name: string,
  args: string[],
): [string, string[]] {
  if (ctx.process.platform === "win32") {
    return ["cmd.exe", ["/c", `${name}.cmd`, ...args]];
  }
  return [name, args];
}

export function npmExec(
  ctx: Context,
  {
    packageName,
    registry,
    args,
    extraEnvVars,
    ignoreStdio,
  }: {
    registry: string;
    packageName: string;
    args: string[];
    extraEnvVars?: Record<string, string>;
    ignoreStdio?: boolean;
  },
): Promise<void> {
  const fullArgs = ["--yes", "--registry", registry, packageName, ...args];

  return new Promise<void>((resolve, reject) => {
    const [npxCmd, npxArgs] = cmd(ctx, "npx", fullArgs);
    const child = ctx.child_process.spawn(npxCmd, npxArgs, {
      stdio: ignoreStdio ? "ignore" : "inherit",
      env: { ...ctx.process.env, ...extraEnvVars },
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`npm exec failed with code ${String(code)}`));
      } else {
        resolve();
      }
    });
  });
}

export async function npmGetLatestVersion(
  ctx: Pick<Context, "child_process" | "process">,
  packageName: string,
  registry: string,
): Promise<string | undefined> {
  try {
    const execFile = promisify(ctx.child_process.execFile);
    const [command, args] = cmd(ctx, "npm", [
      "view",
      packageName,
      "version",
      "--registry",
      registry,
    ]);
    const { stdout } = await execFile(command, args);
    return stdout.trim() || undefined;
  } catch {
    return undefined;
  }
}

export function npmInstall(
  ctx: Context,
  log: Log,
  {
    prefix,
    packageName,
    registry,
    verbose,
  }: {
    prefix: string;
    packageName: string;
    registry: string;
    verbose?: boolean;
  },
): Promise<void> {
  const args = [
    "--registry",
    registry,
    "--no-save",
    ...(verbose ? ["--verbose"] : []),
    "--no-package-lock",
    "--global",
    "--prefix",
    prefix,
    "install",
    packageName,
  ];

  return new Promise<void>((resolve, reject) => {
    const [npmCmd, npmArgs] = cmd(ctx, "npm", args);
    const child = ctx.child_process.spawn(npmCmd, npmArgs, {
      stdio: ["inherit", "pipe", "pipe"],
    });

    const onData = (data: Buffer) => {
      for (const line of data.toString().split("\n")) {
        if (line) {
          log.message(line);
        }
      }
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);

    child.on("error", (err) => {
      reject(err);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `npm install ${packageName} exited with code ${String(code)}`,
          ),
        );
      }
    });
  });
}
