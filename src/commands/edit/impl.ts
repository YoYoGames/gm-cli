import type { Context } from "../../context";
import { findProjectFile } from "../../project";
import { spawnResourceTool } from "../../resourceTool";
import { KnownError } from "../../error";

interface EditCommandFlags {
  mcp?: boolean;
}

export default async function (
  this: Context,
  flags: EditCommandFlags,
  project?: string,
): Promise<void> {
  const cwd = this.process.cwd();
  const projectPath = project ?? (await findProjectFile(this, cwd));
  // FIXME: get the project-tool path too

  try {
    // FIXME: handle project path
    await spawnResourceTool(this, "");
  } catch (e) {
    throw new KnownError(e);
  }
}
