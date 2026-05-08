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
import { Range, SemVer } from "semver";

const toolchainTypeSchema = z
  .string()
  .transform((s) => s.toUpperCase())
  .pipe(z.enum(["GMS2", "GMRT"], { error: "Expected GMS2 or GMRT" }));

// FIXME: we should probably allow channels like "beta", "lts" too
export const gms2VersionSchema = z
  .string()
  .regex(
    /^\d+(\.\d+){0,3}$/,
    "Expected version in format A.B.C.D (fewer digits allowed too)",
  )
  .transform((s) => {
    const parts = s.split(".").map(Number);
    return [parts[0], parts[1], parts[2], parts[3]] as [
      number,
      number | undefined,
      number | undefined,
      number | undefined,
    ];
  });

export const gmrtVersionSchema = z
  .string()
  .regex(
    /^\d+(\.\d+){0,2}$/,
    "Expected version in format X.Y.Z (fewer digits allowed too)",
  )
  .transform((s) => new Range(s));

export function parseToolchainVersion(s: string): ToolchainVersion {
  const [rawType, rawVersion] = s.split("@", 2);

  const typeResult = toolchainTypeSchema.safeParse(rawType);
  if (!typeResult.success) {
    throw new Error(typeResult.error.issues[0]?.message);
  }
  const type = typeResult.data;

  if (rawVersion === undefined) {
    return { type };
  }

  if (type === "GMS2") {
    const versionResult = gms2VersionSchema.safeParse(rawVersion);
    if (!versionResult.success) {
      throw new Error(versionResult.error.issues[0]?.message);
    }
    return { type, version: versionResult.data };
  }

  const versionResult = gmrtVersionSchema.safeParse(rawVersion);
  if (!versionResult.success) {
    throw new Error(versionResult.error.issues[0]?.message);
  }
  return { type, version: versionResult.data };
}

/**
 * Check whether a version satisfies a version prefix.
 * Only the components specified in the prefix (non-undefined) are compared,
 * so a prefix of [2024] matches any 2024.x.x.x version.
 */
export function gms2VersionSatisfies(
  version: Gms2VersionPartial,
  prefix: Gms2VersionPartial,
): boolean {
  for (let i = 0; i < 4; i++) {
    const p = prefix[i];
    if (p === undefined) {
      break;
    }
    if (version[i] !== p) {
      return false;
    }
  }
  return true;
}

/**
 * Compare two GMS2 versions for sorting.
 * Returns a positive number if `a` is newer than `b`, negative if older, 0 if equal.
 */
export function gms2VersionCompare(
  a: Gms2VersionPartial,
  b: Gms2VersionPartial,
): number {
  for (let i = 0; i < 4; i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }
  return 0;
}

export function gms2VersionToString(version: Gms2VersionPartial): string {
  return version.map((v) => v?.toString() ?? "*").join(".");
}

export function gmrtVersionToString(version: GmrtVersionRange): string {
  return version.raw;
}

export type GmrtVersionRange = z.infer<typeof gmrtVersionSchema>;

export type GmrtVersion = SemVer;

export type Gms2VersionPartial = z.infer<typeof gms2VersionSchema>;

export type Gms2Version = [number, number, number, number];

export type ToolchainType = z.infer<typeof toolchainTypeSchema>;

export type ToolchainVersion =
  | {
      type: "GMS2";
      version?: Gms2VersionPartial;
    }
  | {
      type: "GMRT";
      version?: GmrtVersionRange;
    };
