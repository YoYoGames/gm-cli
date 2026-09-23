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

import type { Cache } from "./cache";
import { exists, type Context } from "./context";
import type { Log } from "./log";
import type { ProjectPath } from "./project";
import { spawnProcess } from "./spawn";

export async function restorePrefabs(
  ctx: Context,
  cache: Cache,
  log: Log,
  {
    projectToolPath,
    projectPath,
    packageToolPath,
    gmpmDllPath,
    verbose,
  }: {
    projectToolPath: string;
    projectPath: ProjectPath;
    packageToolPath: string;
    verbose: boolean;
    gmpmDllPath: string;
  },
): Promise<string> {
  const prefabsDir = await cache.getSubDirPath(ctx, "prefabs");
  await seedPrefabsFromIdeStores(ctx, log, { projectPath, prefabsDir });
  // TODO LATER: add options to pick registry etc.
  const args = [
    "PREFABS",
    "RESTORE",
    `SOURCE=${projectPath}`,
    `PACKAGETOOL=${packageToolPath}`,
    `GMPM_DLL=${gmpmDllPath}`,
    `PACKAGETOOLVERBOSE=${verbose ? "TRUE" : "FALSE"}`,
    `PREFABSFOLDER=${prefabsDir}`,
  ];
  await spawnProcess(ctx, log, {
    cmd: projectToolPath,
    args,
    verbose,
    errorLabel: 'Failed to restore project. "ProjectTool PREFABS RESTORE"',
  });
  return prefabsDir;
}

/**
 * Directories the GameMaker IDE unpacks prefab packages into, one
 * `<name>-<version>` folder per package. The IDE keeps this store per machine
 * rather than per project, so a project built in the IDE looks, to us, like it
 * has no prefabs at all.
 *
 * Each entry is a directory that may hold several `GameMakerStudio2*` installs
 * (stable, Beta, Dev, LTS2026, ...), each with its own `Prefabs` folder.
 */
function idePrefabStoreRoots(ctx: Context): string[] {
  switch (ctx.process.platform) {
    case "win32":
      return [ctx.env.PROGRAMDATA ?? "C:\\ProgramData"];
    case "darwin":
      return ["/Users/Shared"];
    default:
      return [ctx.path.join(ctx.os.homedir(), ".config")];
  }
}

/**
 * Copy any prefab package the project references out of the IDE's store and
 * into the folder we hand to ProjectTool, so it doesn't have to fetch them.
 *
 * This is a workaround: fetching is PackageTool's job, but the newest published
 * package-tool binds to gmpm by reflection and no longer matches the gmpm we
 * install alongside it, so every fetch dies with "Parameter count mismatch".
 * Seeding from the IDE store sidesteps the fetch entirely on machines that have
 * the IDE. Once package-tool is republished against the current gmpm this only
 * saves a download and can go away.
 *
 * Best effort throughout: anything we can't work out is left to ProjectTool,
 * which reports missing prefabs far better than we could here.
 */
async function seedPrefabsFromIdeStores(
  ctx: Context,
  log: Log,
  { projectPath, prefabsDir }: { projectPath: ProjectPath; prefabsDir: string },
): Promise<void> {
  try {
    const referenced = await readPrefabReferences(ctx, projectPath);
    if (referenced.length === 0) {
      return;
    }

    // ProjectTool looks next to the project as well as in the folder we pass,
    // so a package in either place is already accounted for.
    const projectPrefabsDir = ctx.path.join(
      ctx.path.dirname(projectPath),
      "prefabs",
    );
    const missing: string[] = [];
    for (const name of referenced) {
      if (
        !(await exists(ctx, ctx.path.join(prefabsDir, name))) &&
        !(await exists(ctx, ctx.path.join(projectPrefabsDir, name)))
      ) {
        missing.push(name);
      }
    }
    if (missing.length === 0) {
      return;
    }

    const stores = await findIdePrefabStores(ctx);
    if (stores.length === 0) {
      return;
    }

    let copied = 0;
    for (const name of missing) {
      for (const store of stores) {
        const src = ctx.path.join(store, name);
        if (!(await exists(ctx, src))) {
          continue;
        }
        await ctx.fs.cp(src, ctx.path.join(prefabsDir, name), {
          recursive: true,
        });
        log.message(`Copied prefab ${name} from ${store}`);
        copied++;
        break;
      }
    }
    if (copied > 0) {
      log.message(
        `Seeded ${String(copied)} of ${String(missing.length)} missing prefabs from the GameMaker IDE`,
      );
    }
  } catch (e) {
    log.message(`Could not read prefabs from the GameMaker IDE: ${String(e)}`);
  }
}

/** Every `GameMakerStudio2*` install's `Prefabs` folder that exists on this machine. */
async function findIdePrefabStores(ctx: Context): Promise<string[]> {
  const stores: string[] = [];
  for (const root of idePrefabStoreRoots(ctx)) {
    let entries: string[];
    try {
      entries = await ctx.fs.readdir(root);
    } catch {
      // Root doesn't exist (no IDE installed, or not where we look on this OS).
      continue;
    }
    for (const entry of entries.sort()) {
      if (!entry.startsWith("GameMakerStudio2")) {
        continue;
      }
      const store = ctx.path.join(root, entry, "Prefabs");
      if (await exists(ctx, store)) {
        stores.push(store);
      }
    }
  }
  return stores;
}

/**
 * Names of the prefab packages a project pulls in, read out of the .yyp's
 * `ForcedPrefabProjectReferences`. The .yyp is JSON with trailing commas, so we
 * pick the names out with a regex rather than teaching the CLI to parse it.
 */
async function readPrefabReferences(
  ctx: Context,
  projectPath: ProjectPath,
): Promise<string[]> {
  const yyp = await ctx.fs.readFile(projectPath, "utf-8");
  const block = /"ForcedPrefabProjectReferences"\s*:\s*\[([\s\S]*?)\]/.exec(
    yyp,
  )?.[1];
  if (!block) {
    return [];
  }
  const names = new Set<string>();
  for (const match of block.matchAll(/"name"\s*:\s*"([^"\\/]+)"/g)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    names.add(match[1]!);
  }
  return [...names];
}
