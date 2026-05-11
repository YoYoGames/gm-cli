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

import type { CommandContext } from "@stricli/core";
import child_process from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import open from "tiny-open";
import http from "node:http";
import { getParsedEnv, type ParsedEnv } from "./parse-env";

export interface Context extends CommandContext {
  readonly process: NodeJS.Process;
  readonly child_process: typeof child_process;
  readonly os: typeof os;
  readonly fs: typeof fs;
  readonly path: typeof path;
  readonly fetch: typeof globalThis.fetch;
  readonly open: typeof open;
  readonly http: typeof http;
  readonly env: ParsedEnv;
}

export async function exists(
  ctx: Pick<Context, "fs">,
  path: string,
): Promise<boolean> {
  try {
    await ctx.fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export function buildContext(process: NodeJS.Process): Context {
  const env = getParsedEnv();
  return {
    process,
    env,
    child_process,
    open,
    http,
    os,
    fs,
    path,
    fetch,
  };
}
