import type { Context } from "./context";
import { KnownError } from "./error";
import type { ProjectPath } from "./project";
import { getPlatformSuffix, npmExec, PRIVATE_REGISTRY } from "./npm";

export type ResourceToolMode =
  | { mode: "cli" }
  | { mode: "mcp" }
  | { mode: "command"; command: string }
  | { mode: "script"; file: string };

export interface ResourceToolArgs {
  run: ResourceToolMode;
  projectPath?: ProjectPath;
  projectToolPath?: string;
  prefabsFolder?: string;
  ignoreStdio?: boolean;
}

function splitCommand(input: string): string[] {
  const args: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of input) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === " " && !inQuotes) {
      if (current) args.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) args.push(current);
  return args;
}

function modeToArgs(run: ResourceToolMode): string[] {
  switch (run.mode) {
    case "command":
      return splitCommand(run.command);
    case "script":
      return ["script", `path=${run.file}`];
    case "cli":
    case "mcp":
      return [run.mode];
    default:
      run satisfies never;
      throw new Error("Unreachable");
  }
}

export async function callResourceTool(
  ctx: Context,
  {
    run,
    projectPath,
    projectToolPath,
    prefabsFolder,
    ignoreStdio,
  }: ResourceToolArgs,
): Promise<void> {
  const command = modeToArgs(run);

  const args = [
    ...command,
    ...(projectPath ? [`projectpath=${projectPath}`] : []),
    ...(projectToolPath ? [`projecttool=${projectToolPath}`] : []),
    ...(prefabsFolder ? [`prefabsfolder=${prefabsFolder}`] : []),
  ];
  const platformSuffix = getPlatformSuffix(ctx);
  const packageName = `@gm-tools/resource-tool-${platformSuffix}@latest`;
  try {
    await npmExec(ctx, {
      packageName,
      args,
      registry: PRIVATE_REGISTRY,
      extraEnvVars:
        ctx.process.platform === "darwin"
          ? { COMPlus_ZapDisable: "1" }
          : undefined,
      ignoreStdio,
    });
  } catch (e) {
    throw new KnownError(e);
  }
}
