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

import { Cache, type CacheType } from "~/cache";
import type { Context } from "~/context";
import { downloadIgor, fetchLicense } from "~/igor";
import { KnownError } from "~/error";
import { findProjectFile } from "~/project";
import { makeTaskLogger } from "../base/make-task-logger";
import type { BaseFlags } from "../base/base-params";

export const LICENSE_FILENAME = "licence.plist";

export default async function (
  this: Context,
  flags: { print?: boolean; cacheDir?: string } & BaseFlags,
  accessKey: string,
): Promise<void> {
  const cwd = this.process.cwd();
  const projectPath = await findProjectFile(this, cwd);

  const cacheType: CacheType = flags.cacheDir
    ? { type: "absolute", path: flags.cacheDir }
    : projectPath
      ? { type: "infer", projectDir: this.path.dirname(projectPath) }
      : // It's fine not to use the cache in a project dir, if so we just use a temporary one
        { type: "temporary" };

  const cache = await Cache.initLazy(this, cacheType);

  if (cacheType.type === "temporary" && !flags.print) {
    throw new KnownError(
      "No project found in the current directory. Run this command from a project directory, or use --print to output the license to stdout.",
    );
  }

  const igorLog = makeTaskLogger(this, flags)("Downloading Igor");
  let igorPath: string;
  try {
    igorPath = await downloadIgor(this, igorLog, cache);
  } catch (e) {
    igorLog.error("Failed to download Igor");
    throw new KnownError(e);
  }
  igorLog.success("Igor downloaded");

  const licenseFile = flags.print
    ? this.path.join(
        this.os.tmpdir(),
        `gm-licence-${String(this.process.pid)}.plist`,
      )
    : this.path.join(
        await cache.getSubDirPath(this, "license"),
        LICENSE_FILENAME,
      );

  const fetchLog = makeTaskLogger(this, flags)("Fetching license");
  try {
    await fetchLicense(this, igorLog, {
      igorPath,
      accessKey,
      outputFile: licenseFile,
    });
  } catch (e) {
    fetchLog.error("Failed to fetch license");
    throw new KnownError(e);
  }
  if (flags.print) {
    const content = await this.fs.readFile(licenseFile, "utf-8");
    this.process.stdout.write("\n" + content + "\n");
    await this.fs.rm(licenseFile);
  } else {
    fetchLog.success(`License saved to "${licenseFile}"`);
  }
}
