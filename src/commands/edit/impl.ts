import { Cache } from "~/cache";
import { type Context, getPrefabsDirOrThrow } from "~/context";
import { findProjectFile, type ProjectPath } from "~/project";
import { KnownError } from "~/error";
import { downloadProjectTool } from "~/projectTool";
import { callResourceTool, type ResourceToolMode } from "~/resourceTool";
import { noopLog } from "~/log";

interface EditCommandFlags {
  mcp?: boolean;
  command?: string;
  prefabs?: string;
  cacheDir?: string;
}

export default async function (
  this: Context,
  flags: EditCommandFlags,
  project?: ProjectPath,
): Promise<void> {
  if (flags.mcp && flags.command) {
    throw new KnownError("Please use either --mcp or --command, not both.");
  }

  const cwd = this.process.cwd();
  const projectPath = project ?? (await findProjectFile(this, cwd));

  const cache = await Cache.getOrInit(
    this,
    flags.cacheDir
      ? { type: "absolute", path: flags.cacheDir }
      : { type: "infer", projectDir: this.path.dirname(projectPath) },
  );
  const projectToolPath = await downloadProjectTool(this, {
    cache,
    log: noopLog,
    verbose: false,
  });

  const run: ResourceToolMode = flags.command
    ? { mode: "command", command: flags.command }
    : flags.mcp
      ? { mode: "mcp" }
      : { mode: "cli" };

  const prefabsFolder = flags.prefabs ?? getPrefabsDirOrThrow(this);
  await callResourceTool(this, {
    run,
    projectPath,
    projectToolPath,
    prefabsFolder,
  });
}
