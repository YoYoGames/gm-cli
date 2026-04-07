import type { Context } from "../../context";
import { findProjectFile } from "../../project";
import { KnownError } from "../../error";
import { callResourceTool, type ResourceToolMode } from "../../resourceTool";

interface EditCommandFlags {
  mcp?: boolean;
  command?: string;
}

export default async function (
  this: Context,
  flags: EditCommandFlags,
  project?: string,
): Promise<void> {
  if (flags.mcp && flags.command) {
    throw new KnownError("Please use either --mcp or --command, not both.");
  }

  const cwd = this.process.cwd();
  const projectPath = project ?? (await findProjectFile(this, cwd));

  const run: ResourceToolMode = flags.command
    ? { mode: "command", command: flags.command }
    : flags.mcp
      ? { mode: "mcp" }
      : { mode: "cli" };

  // FIXME: include path to project tool
  await callResourceTool(this, { run, projectPath });
}
