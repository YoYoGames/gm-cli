import type { Context } from "../../context";
import { findProjectFile } from "../../project";
import { KnownError } from "../../error";
import { getPlatformSuffix, npmExec, PRIVATE_REGISTRY } from "../../npm";

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

  const packageName = `@gm-tools/resource-tool-${getPlatformSuffix()}@latest`;
  try {
    await npmExec(this, {
      packageName,
      // FIXME: include path to project tool
      args: [flags.mcp ? "mcp" : "cli", `projectpath=${projectPath}`],
      registry: PRIVATE_REGISTRY,
      extraEnvVars:
        process.platform === "darwin" ? { COMPlus_ZapDisable: "1" } : undefined,
    });
  } catch (e) {
    throw new KnownError(e);
  }
}
