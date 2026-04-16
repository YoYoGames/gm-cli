import { Cache } from "~/cache";
import { type Context, getPrefabsDirOrThrow } from "~/context";
import { findProjectFile, type ProjectPath } from "~/project";
import { downloadProjectTool } from "~/projectTool";
import { callResourceTool, type ResourceToolMode } from "~/resourceTool";
import { noopLog } from "~/log";

export interface CommonFlags {
  prefabs?: string;
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
  const projectToolPath = await downloadProjectTool(ctx, {
    cache,
    log: noopLog,
    verbose: false,
  });

  const prefabsFolder = flags.prefabs ?? getPrefabsDirOrThrow(ctx);
  await callResourceTool(ctx, {
    run: mode,
    projectPath,
    projectToolPath,
    prefabsFolder,
  });
}
