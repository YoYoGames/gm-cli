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

import { npmGetLatestVersion } from "./npm";
import child_process from "node:child_process";
import { Cache } from "./cache";
import os from "node:os";
import nodePath from "node:path";
import fs from "node:fs/promises";
import { version as myVersion } from "../package.json";
import { z } from "zod";
import semver from "semver";
import { getParsedEnv } from "./parse-env";

const versionCheckSchema = z.object({
  lastVersion: z.string(),
  lastChecked: z.number(),
});

export async function getLatestVersion(): Promise<string | undefined> {
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  // We have not constructed the full context object yet, so we have to build a partial one here
  const ctx = {
    os,
    path: nodePath,
    fs,
    process,
    child_process,
    env: getParsedEnv(),
  };

  // Get the path to a file where we can store the last time we checked the version
  if (ctx.env.CI === true) {
    // However, using a shared only cache will panic in CI since it does not allow shared partitions
    // so let's skip the version check altogether
    return;
  }
  const cache = new Cache(ctx, { type: "shared-only" });
  const dir = await cache.getSubDirPath(ctx, "version-check", {
    preferShared: true,
  });
  const checkFile = nodePath.join(dir, "check.json");

  try {
    const data = versionCheckSchema.parse(
      JSON.parse(await fs.readFile(checkFile, "utf-8")),
    );
    // If we recently checked for newer version just used our cached value
    if (Date.now() - data.lastChecked < THREE_DAYS_MS) {
      // We should only return the last version if it's actually
      // a greater version then the one we are currently running
      return semver.gt(data.lastVersion, myVersion)
        ? data.lastVersion
        : undefined;
    }
  } catch {
    // File doesn't exist or is malformed, proceed to fetch
  }

  const latest = await npmGetLatestVersion(
    ctx,
    "@gamemaker/gm-cli",
    "https://registry.npmjs.org",
  );
  if (latest) {
    try {
      await ctx.fs.writeFile(
        checkFile,
        JSON.stringify({
          lastVersion: latest,
          lastChecked: Date.now(),
        } satisfies z.infer<typeof versionCheckSchema>),
      );
    } catch {
      // Ignore write errors
    }
  }
  return latest && semver.gt(latest, myVersion) ? latest : undefined;
}
