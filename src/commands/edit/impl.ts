import type { Context } from "../../context";
import { findProjectFile } from "../../project";
import { downloadResourceTool } from "../../resourceTool";
import { KnownError } from "../../error";

interface EditCommandFlags {
  verbose?: boolean;
  mcp?: boolean;
}

export default async function (
  this: Context,
  flags: EditCommandFlags,
  project?: string,
): Promise<void> {
  const cwd = this.process.cwd();
  const projectPath = project ?? (await findProjectFile(this, cwd));

  const cacheDir = this.path.join(cwd, ".gmcache");
  const resourceToolDir = this.path.join(cacheDir, "resource-tool");

  let resourceToolPath: string;
  try {
    resourceToolPath = await downloadResourceTool(this, {
      destDir: resourceToolDir,
      log: { message() {}, error() {}, success() {} },
      verbose: flags.verbose ?? false,
    });
  } catch (e) {
    throw new KnownError(e);
  }

  this.child_process.execFileSync(
    resourceToolPath,
    // FIXME: include path to project tool
    [flags.mcp ? "mcp" : "cli", ...[`projectpath="${projectPath}"`]],
    {
      stdio: "inherit",
      env:
        process.platform === "darwin"
          ? { ...process.env, COMPlus_ZapDisable: "1" }
          : undefined,
    },
  );
}
