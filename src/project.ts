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

import type { Context } from "./context";
import { KnownError } from "./error";

export type ProjectPath = string & { readonly __brand: unique symbol };

export function parseProjectPath(s: string): ProjectPath {
  if (!s.endsWith(".yyp")) {
    throw new KnownError(`Expected a file with the .yyp extension.`);
  }
  return s as ProjectPath;
}

export async function findProjectFile(
  ctx: Pick<Context, "path" | "fs">,
  dir: string,
): Promise<undefined | ProjectPath> {
  const files = await ctx.fs.readdir(dir);
  const yypFile = files.find((f: string) => f.endsWith(".yyp"));
  if (!yypFile) {
    return undefined;
  }
  return ctx.path.join(dir, yypFile) as ProjectPath;
}

export function getProjectName(ctx: Context, projectPath: ProjectPath) {
  return ctx.path.basename(projectPath, ".yyp");
}
