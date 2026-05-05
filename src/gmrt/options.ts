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
import type { GmrtTarget } from "~/target";

function hostPlatformOption<T extends z.ZodType>(schema: T) {
  return z.object({ macos: schema, windows: schema, linux: schema });
}

function targetOption<T extends z.ZodType>(schema: T) {
  return z.object({
    mac: schema,
    windows: schema,
    linux: schema,
    operagx: schema,
  });
}

const jobSchema = z.object({ native: z.string(), vm: z.string() });

/**
 * Compilation options that are unique to GMRT.
 * There are more options that are shared with the GMS2 toolchain
 */
export const gmrtToolchainOptionsSchema = z.object({
  buildGraph: hostPlatformOption(z.string()),
  runJob: targetOption(jobSchema),
  compileJob: targetOption(jobSchema),
  packageJob: targetOption(jobSchema),
  scriptBuildType: z.enum(["Release", "Debug"]),
  // TODO later: target-preferences
  // TODO later: gmrt-preferences
  // TODO later: target-options
  // TODO later: buildType: "Release" | "Debug"; // Maybe not needed to expose since we only ship release builds...
});

export type GmrtToolchainOptions = z.infer<typeof gmrtToolchainOptionsSchema>;

// Used when given by user
export const gmrtToolchainOptionsPartial = gmrtToolchainOptionsSchema.partial();

export type GmrtToolchainOptionsPartial = z.infer<
  typeof gmrtToolchainOptionsPartial
>;

export type HostPlatform = "macos" | "windows" | "linux";

const platformToHost: Partial<Record<NodeJS.Platform, HostPlatform>> = {
  darwin: "macos",
  win32: "windows",
  linux: "linux",
};

export function pickHostOption<T>(
  options: Record<HostPlatform, T>,
  platform: NodeJS.Platform,
): T {
  const key = platformToHost[platform];
  if (!key) {
    throw new Error(`Unsupported host platform: ${platform}`);
  }
  return options[key];
}

export function pickTargetJob(
  jobs: GmrtToolchainOptions["runJob"],
  target: GmrtTarget,
  runtime: "native" | "vm",
): string {
  return jobs[target][runtime];
}

export function resolveOptions(
  defaults: GmrtToolchainOptions,
  overrides: GmrtToolchainOptionsPartial,
): GmrtToolchainOptions {
  return {
    buildGraph: overrides.buildGraph ?? defaults.buildGraph,
    runJob: overrides.runJob ?? defaults.runJob,
    compileJob: overrides.compileJob ?? defaults.compileJob,
    packageJob: overrides.packageJob ?? defaults.packageJob,
    scriptBuildType: overrides.scriptBuildType ?? defaults.scriptBuildType,
  };
}

export function defaultOptions(
  ctx: Context,
  runtimeDir: string,
): GmrtToolchainOptions {
  const targetsDir = ctx.path.join(
    runtimeDir,
    "package",
    "Release",
    "bin",
    "targets",
  );

  return {
    buildGraph: {
      macos: ctx.path.join(targetsDir, "buildgraph-macarm64-prod.xml"),
      windows: ctx.path.join(targetsDir, "buildgraph-win64-prod.xml"),
      linux: ctx.path.join(targetsDir, "buildgraph-linux64-prod.xml"),
    },
    compileJob: {
      mac: {
        native: "Build-native-macos-arm64",
        vm: "Build-interpreter-macos-arm64",
      },
      windows: {
        native: "Build-native-windows-x64",
        vm: "Build-interpreter-windows-x64",
      },
      linux: { native: "Build-native-linux-x64", vm: "Build-native-linux-x64" },
      operagx: {
        native: "Build-native-wasm32-browser",
        vm: "Build-native-wasm32-browser",
      },
    },
    runJob: {
      mac: {
        native: "Build-native-macos-arm64;Run-macos-arm64",
        vm: "Build-interpreter-macos-arm64;Run-macos-arm64",
      },
      windows: {
        native: "Build-native-windows-x64;Run-windows-x64",
        vm: "Build-interpreter-windows-x64;Run-windows-x64",
      },
      linux: {
        native: "Build-native-linux-x64;Run-linux-x64",
        vm: "Build-native-linux-x64;Run-linux-x64",
      },
      operagx: {
        native: "Build-native-wasm32-browser;Run-wasm32-browser",
        vm: "Build-native-wasm32-browser;Run-wasm32-browser",
      },
    },
    packageJob: {
      mac: {
        native: "Build-native-macos-arm64;Package-macos-arm64",
        vm: "Build-interpreter-macos-arm64;Package-macos-arm64",
      },
      windows: {
        native: "Build-native-windows-x64;Package-windows-x64",
        vm: "Build-interpreter-windows-x64;Package-windows-x64",
      },
      linux: {
        native: "Build-native-linux-x64;Package-linux-x64",
        vm: "Build-native-linux-x64;Package-linux-x64",
      },
      operagx: {
        native: "Build-native-wasm32-browser;Package-wasm32-browser",
        vm: "Build-native-wasm32-browser;Package-wasm32-browser",
      },
    },
    scriptBuildType: "Debug",
  };
}
