import type { Context } from "../../context";
import { findProjectFile } from "../../project";
import { KnownError } from "../../error";
import { getPlatformSuffix, npmExec, PRIVATE_REGISTRY } from "../../npm";

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
  // FIXME: get the project-tool path too
  const packageName = `@gm-tools/resource-tool-${getPlatformSuffix()}@latest`;
  const command = flags.command?.split(" ") ?? [flags.mcp ? "mcp" : "cli"];
  const args = [...command, `projectpath=${projectPath}`];
  try {
    await npmExec(this, {
      packageName,
      // FIXME: include path to project tool
      args,
      registry: PRIVATE_REGISTRY,
      extraEnvVars:
        process.platform === "darwin" ? { COMPlus_ZapDisable: "1" } : undefined,
    });
  } catch (e) {
    throw new KnownError(e);
  }
}
