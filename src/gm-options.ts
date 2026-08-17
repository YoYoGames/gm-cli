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
import type { Context } from "./context";
import type { GmrtTarget } from "./target";
import {
  parseToolchainVersion,
  toolchainVersionToString,
  type ToolchainVersion,
} from "./toolchain";
import { KnownError } from "./error";
import type { Cache } from "./cache";
import { version } from "package.json";
import type { GmrtToolchainOptions } from "./gmrt/options";

function perHostPlatform<T extends z.ZodType>(schema: T) {
  return z.object({ mac: schema, windows: schema, linux: schema }).partial();
}

function perGmrtTarget<T extends z.ZodType>(schema: T) {
  return z
    .object({
      mac: schema,
      windows: schema,
      linux: schema,
      operagx: schema,
    })
    .partial();
}

const jobSchema = z.object({
  vm: z.string().describe("Job name to use when building with the VM runtime"),
  native: z
    .string()
    .describe("Job name to use when building with the native runtime"),
});

export const gmrtSchema = z
  .object({
    buildGraph: perHostPlatform(
      z.string().describe("Path to the build graph .xml file"),
    ),
    jobRun: perGmrtTarget(jobSchema).describe("Job overrides for `gm run`"),
    jobCompile: perGmrtTarget(jobSchema).describe(
      "Job overrides for `gm compile`",
    ),
    jobPackage: perGmrtTarget(jobSchema).describe(
      "Job overrides for `gm package`",
    ),
    scriptBuildType: z
      .enum(["Release", "Debug"])
      .describe("Build type for compiled GML"),
  })
  .partial();

export const gms2Schema = z
  .object({
    operagx: z
      .object({
        packageType: z.enum(["zip", "wallpaper", "gamestrip"]),
        emscriptenSdk: z
          .string()
          .describe("Path to the Emscripten SDK used when building with YYC"),
      })
      .partial(),
    windows: z
      .object({
        packageType: z.enum(["zip", "nsis"]),
        visualStudioSdk: z
          .string()
          .describe(
            "Path to VsDevCmd.bat, used when building with YYC. For example 'C:\\Program Files\\Microsoft Visual Studio\\18\\Community\\Common7\\Tools\\VsDevCmd.bat'.",
          ),
      })
      .partial(),
    mac: z
      .object({
        packageType: z.enum(["zip", "dmg"]),
      })
      .partial(),
    linux: z
      .object({
        packageType: z.enum(["zip", "appimage"]),
      })
      .partial(),
    android: z
      .object({
        packageType: z.enum(["apk", "aab"]),
        sdkPath: z.string().describe("Path to the Android SDK directory"),
        ndkPath: z.string().describe("Path to the Android NDK directory"),
        jdkPath: z.string().describe("Path to the JDK directory"),
        keystoreFile: z
          .string()
          .describe("Path to the keystore file used for signing"),
        keystorePassword: z.string().describe("Password for the keystore"),
        keystoreAlias: z.string().describe("Alias of the key in the keystore"),
        keystoreAliasPassword: z
          .string()
          .describe("Password for the keystore alias"),
      })
      .partial(),
  })
  .partial();

/** Schema for `gm-options.json` file.
 *
 * Design note: this file should only ever act as a convenience!
 * All options *must* also be possible to set directly as CLI arguments (with
 * the exception of the "tool" object.)
 */
const gmOptionsRawSchema = z
  .object({
    $schema: z.string().describe("Path to the JSON schema file"),
    toolchain: z
      .string()
      .describe("Toolchain to use, e.g. GMS2, GMS2@2024.14.4, or GMRT@0.18"),
    gmrt: gmrtSchema.describe("Toolchain options specific to GMRT"),
    gms2: gms2Schema.describe("Toolchain options specific to GMS2"),
    externalTools: z
      .record(z.string(), z.unknown())
      .describe(
        "An object for external tools to attach arbitrary metadata to the project",
      ),
  })
  .partial()
  .strict();

type GmOptionsRaw = z.infer<typeof gmOptionsRawSchema>;

export interface GmOptions {
  toolchain?: ToolchainVersion;
  gmrt?: GmOptionsRaw["gmrt"];
  gms2?: GmOptionsRaw["gms2"];
  externalTools?: Record<string, unknown>;
}

function parseGmOptions(
  raw: string,
): { success: true; options: GmOptions } | { success: false; error: string } {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { success: false, error: "Not valid JSON" };
  }

  const result = gmOptionsRawSchema.safeParse(json);
  if (!result.success) {
    const error = result.error.issues
      .map(
        (i) => `- ${i.path.length ? `${i.path.join(".")}: ` : ""}${i.message}`,
      )
      .join("\n");
    return { success: false, error };
  }

  let toolchain: undefined | ToolchainVersion = undefined;
  if (result.data.toolchain) {
    try {
      toolchain = parseToolchainVersion(result.data.toolchain);
    } catch (e) {
      return {
        success: false,
        error: `Failed to parse toolchain string "${result.data.toolchain}". Error: ${e instanceof Error ? e : String(e)}`,
      };
    }
  }

  return {
    success: true,
    options: {
      toolchain,
      gms2: result.data.gms2,
      gmrt: result.data.gmrt,
      externalTools: result.data.externalTools,
    },
  };
}

const GM_OPTIONS_FILENAME = "gm-options.json";

// Undefined if there is no "gm-options.json" file. Throws if
// we fail to parse the file.
export async function readGmOptions(
  ctx: Context,
  cache: Cache,
  projectDir: string,
): Promise<GmOptions | undefined> {
  const filePath = ctx.path.join(projectDir, GM_OPTIONS_FILENAME);
  let raw: string;
  try {
    raw = await ctx.fs.readFile(filePath, "utf-8");
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      return undefined;
    }
    throw e;
  }

  let gmOptions: undefined | GmOptions;
  const parseResults = parseGmOptions(raw);
  if (parseResults?.success) {
    gmOptions = parseResults.options;
  } else {
    throw new KnownError(
      "Failed to parse 'gm-options.json file. Errors:\n{parseResults.error}",
    );
  }

  // Make sure there is a schema file in our cache
  // (not that nice that we write it every time, but at least it's not blocking)
  void createGmOptionsJsonSchema(ctx, cache);

  return gmOptions;
}

export async function writeGmOptions(
  ctx: Context,
  cache: Cache,
  projectDir: string,
  gmOptions: GmOptions,
) {
  const schemaPath = ctx.path.relative(
    projectDir,
    await createGmOptionsJsonSchema(ctx, cache),
  );

  const options = {
    ...gmOptions,
    $schema: schemaPath,
    // Serialize the toolchain as a string instead of the object we use internally
    toolchain: gmOptions.toolchain
      ? toolchainVersionToString(gmOptions.toolchain)
      : undefined,
  };
  const filePath = ctx.path.join(projectDir, GM_OPTIONS_FILENAME);
  await ctx.fs.writeFile(filePath, JSON.stringify(options, null, 2) + "\n");
}

const GM_OPTIONS_SCHEMA_FILENAME = `gm-options-schema-${version.split(".")[0] ?? ""}.json`;

export async function createGmOptionsJsonSchema(
  ctx: Context,
  cache: Cache,
): Promise<string> {
  const schemasDir = await cache.getSubDirPath(ctx, "schemas");
  const filePath = ctx.path.join(schemasDir, GM_OPTIONS_SCHEMA_FILENAME);
  const schema =
    JSON.stringify(z.toJSONSchema(gmOptionsRawSchema), null, 2) + "\n";
  await ctx.fs.writeFile(filePath, schema);
  return filePath;
}

function hostPlatformKey(ctx: Context): "mac" | "windows" | "linux" {
  const platform = ctx.os.platform();
  switch (platform) {
    case "darwin":
      return "mac";
    case "win32":
      return "windows";
    case "linux":
      return "linux";
    default:
      throw new KnownError(`Platform '${platform}' is not supported`);
  }
}

export function resolveGmrtToolchainOptions(
  ctx: Context,
  gmrt: GmOptions["gmrt"],
  command: "run" | "package" | "compile",
  target: GmrtTarget,
  runtime: "native" | "vm",
): Partial<GmrtToolchainOptions> {
  if (!gmrt) {
    return {};
  }

  const jobMap =
    command === "run"
      ? gmrt.jobRun
      : command === "compile"
        ? gmrt.jobCompile
        : gmrt.jobPackage;

  return {
    buildGraph: gmrt.buildGraph?.[hostPlatformKey(ctx)],
    job: jobMap?.[target]?.[runtime],
    scriptBuildType: gmrt.scriptBuildType,
  };
}
