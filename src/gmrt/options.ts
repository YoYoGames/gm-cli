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
import type { GmrtTarget } from "~/target";

export interface GmrtToolchainOptions {
  buildGraph: string;
  job: string;
  scriptBuildType: "Release" | "Debug";
}

export function defaultBuildGraph(ctx: Context, runtimeDir: string): string {
  const targetsDir = ctx.path.join(
    runtimeDir,
    "package",
    "Release",
    "bin",
    "targets",
  );
  const platform = ctx.os.platform();
  switch (platform) {
    case "darwin":
      return ctx.path.join(targetsDir, "buildgraph-macarm64-prod.xml");
    case "win32":
      return ctx.path.join(targetsDir, "buildgraph-win64-prod.xml");
    case "linux":
      return ctx.path.join(targetsDir, "buildgraph-linux64-prod.xml");
    default:
      throw new Error(`Unsupported host platform: ${platform}`);
  }
}

export function defaultJob(
  target: GmrtTarget,
  runtime: "native" | "vm",
  commandType: "run" | "compile" | "package",
): string {
  const buildStep: Record<GmrtTarget, string> =
    runtime === "native"
      ? {
          mac: "Build-native-macos-arm64",
          windows: "Build-native-windows-x64",
          linux: "Build-native-linux-x64",
          operagx: "Build-native-wasm32-browser",
        }
      : {
          mac: "Build-interpreter-macos-arm64",
          windows: "Build-interpreter-windows-x64",
          linux: "Build-interpreter-linux-x64",
          operagx: "Build-interpreter-wasm32-browser",
        };

  if (commandType === "compile") {
    return buildStep[target];
  }

  const secondStep: Record<GmrtTarget, string> =
    commandType === "run"
      ? {
          mac: "Run-macos-arm64",
          windows: "Run-windows-x64",
          linux: "Run-linux-x64",
          operagx: "Run-wasm32-browser",
        }
      : {
          mac: "Package-macos-arm64",
          windows: "Package-windows-x64",
          linux: "Package-linux-x64",
          operagx: "Package-wasm32-browser",
        };

  return `${buildStep[target]};${secondStep[target]}`;
}
