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
import chalk from "chalk";
import type { Context } from "~/context";
import { setupCache, validateFlags, type CacheFlags } from "./command";

async function listSubdirs(ctx: Context, dir: string): Promise<string[]> {
  const entries = await ctx.fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

export default async function (
  this: Context,
  flags: CacheFlags,
): Promise<void> {
  validateFlags(flags);
  const cache = await setupCache(this, flags);
  const localPath = await cache._getInternalLocalPath(this);
  const sharedPath = await cache._getInternalSharedPath(this);
  this.process.stdout.write(chalk.bold("Shared cache\n"));
  this.process.stdout.write(
    `${sharedPath ?? "Not used when explicit --cache-dir is set"}\n`,
  );
  if (sharedPath) {
    const subdirs = await listSubdirs(this, sharedPath);
    this.process.stdout.write(`Contents: ${subdirs.join(", ") || "(none)"}\n`);
  }
  this.process.stdout.write("\n");
  this.process.stdout.write(chalk.bold("Local cache\n"));
  this.process.stdout.write(
    `${localPath ?? "Not used. Specify a --project"}\n`,
  );
  if (localPath) {
    const subdirs = await listSubdirs(this, localPath);
    this.process.stdout.write(`Contents: ${subdirs.join(", ") || "(none)"}\n`);
  }
}
