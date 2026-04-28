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

async function cleanPath(
  ctx: Context,
  label: string,
  path: string | undefined,
): Promise<void> {
  ctx.process.stdout.write(chalk.bold(`${label}\n`));
  if (!path) {
    ctx.process.stdout.write("Skipped\n\n");
    return;
  }
  ctx.process.stdout.write(`${path}\n`);
  await ctx.fs.rm(path, { recursive: true, force: true });
  ctx.process.stdout.write("Cleaned\n\n");
}

export default async function (
  this: Context,
  flags: CacheFlags,
): Promise<void> {
  validateFlags(flags);
  const cache = await setupCache(this, flags);
  const localPath = await cache.getLocalPathStrict(this);
  const sharedPath = await cache.getSharedPathStrict(this);
  await cleanPath(this, "Shared cache", sharedPath);
  await cleanPath(this, "Local cache", localPath);
}
