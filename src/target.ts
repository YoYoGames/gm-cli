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

/**
 * Currently, GMRT only includes a subset of the targets that's supported by the GMS2 toolchain
 */
const TARGETS_GMRT = [
  "mac",
  "windows",
  "linux",
  "operagx",
] as const satisfies readonly Target[];

export type GmrtTarget = (typeof TARGETS_GMRT)[number];

export function supportedInGmrt(target: Target): target is GmrtTarget {
  return (TARGETS_GMRT as readonly string[]).includes(target);
}

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
