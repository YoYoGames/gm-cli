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
import { z } from "zod";

// From Zeus/Igor/Modules.cs and Zeus/Igor/Targets.cs in GameMaker repo
export const TARGETS = [
  "amazonfire",
  "mac",
  "windows",
  "ios",
  "android",
  "html5",
  "linux",
  "ps4",
  "ps5",
  "xboxone",
  "xboxseriesxs",
  "winuwp",
  "tvos",
  "switch",
  "switch2",
  "wasm",
  "operagx",
  "reddit",
] as const;

export const TargetSchema = z
  .string()
  .transform((s) => s.toLowerCase())
  .pipe(z.enum(TARGETS));

export type Target = z.infer<typeof TargetSchema>;

export function targetForPlatform(platform: NodeJS.Platform): Target {
  switch (platform) {
    case "win32":
      return "windows";
    case "darwin":
      return "mac";
    case "linux":
      return "linux";
    default:
      throw new Error(`No default target for platform: ${platform}`);
  }
}

/**
 * Modules are more or less just the targets + the base module for your host platform
 */
const ModuleSchema = z.union([
  TargetSchema,
  z.literal("base"),
  z
    .string()
    .regex(/^base-module-.+-.+$/)
    .transform((s) => s as `base-module-${string}-${string}`),
]);

export type Module = z.infer<typeof ModuleSchema>;

export async function getInstalledRuntimeModules(
  ctx: Context,
  runtimeLocation: string,
): Promise<Module[]> {
  const receiptPath = ctx.path.join(runtimeLocation, "receipt.json");
  const content = await ctx.fs.readFile(receiptPath, "utf-8");
  const receipt = z.record(z.string(), z.unknown()).parse(JSON.parse(content));

  return Object.keys(receipt)
    .map((key) => ModuleSchema.safeParse(key))
    .filter((result) => result.success)
    .map((result) => result.data);
}

export function packageExtension(target: Target): string | undefined {
  switch (target) {
    case "windows":
    case "linux":
    case "mac":
    case "operagx":
      return ".zip";
    default:
      // FIXME: implement for all platforms
      return;
  }
}
