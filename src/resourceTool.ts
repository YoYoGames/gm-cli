import type { Context } from "./context";
import { KnownError } from "./error";
import { getPlatformSuffix, npmExec, PRIVATE_REGISTRY } from "./npm";

export type ResourceToolMode =
  | { mode: "cli" }
  | { mode: "mcp" }
  | { mode: "command"; command: string };

export interface ResourceToolArgs {
  run: ResourceToolMode;
  projectPath?: string;
}

export async function callResourceTool(
  ctx: Context,
  { run, projectPath }: ResourceToolArgs,
): Promise<void> {
  const command = run.mode === "command" ? run.command.split(" ") : [run.mode];

  const args = [
    ...command,
    // FIXME: include the project tool
    ...(projectPath ? [`projectpath=${projectPath}`] : []),
  ];
  const packageName = `@gm-tools/resource-tool-${getPlatformSuffix()}@latest`;
  try {
    await npmExec(ctx, {
      packageName,
      args,
      registry: PRIVATE_REGISTRY,
      extraEnvVars:
        process.platform === "darwin" ? { COMPlus_ZapDisable: "1" } : undefined,
    });
  } catch (e) {
    throw new KnownError(e);
  }
}
