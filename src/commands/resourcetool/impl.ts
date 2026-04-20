import { Cache } from "~/cache";
import { type Context } from "~/context";
import { findProjectFile, type ProjectPath } from "~/project";
import {
  downloadGmpm,
  downloadPackageTool,
  downloadProjectTool,
} from "~/gmTools";
import { callResourceTool, type ResourceToolMode } from "~/resourceTool";
import { noopLog } from "~/log";
import { restorePrefabs } from "~/restorePrefabs";

export interface CommonFlags {
  cacheDir?: string;
}

export async function run(
  ctx: Context,
  flags: CommonFlags,
  project: ProjectPath | undefined,
  mode: ResourceToolMode,
): Promise<void> {
  const cwd = ctx.process.cwd();
  const projectPath = project ?? (await findProjectFile(ctx, cwd));

  const cache = await Cache.getOrInit(
    ctx,
    flags.cacheDir
      ? { type: "absolute", path: flags.cacheDir }
      : { type: "infer", projectDir: ctx.path.dirname(projectPath) },
  );
  const projectToolPath = await downloadProjectTool(ctx, cache, noopLog, {
    verbose: false,
  });
  const gmpmPath = await downloadGmpm(ctx, cache, noopLog, {
    verbose: false,
  });
  const packageToolPath = await downloadPackageTool(ctx, cache, noopLog, {
    verbose: false,
  });

  await restorePrefabs(ctx, cache, noopLog, {
    projectToolPath,
    projectPath,
    packageToolPath,
    gmpmPath,
    verbose: false,
  });

  await callResourceTool(ctx, {
    run: mode,
    projectPath,
    projectToolPath,
    prefabsFolder: await cache.getSubDirPath(ctx, "prefabs"),
  });
}
