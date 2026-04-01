import path from "path";
import type { Context } from "./context";
import { getPlatformSuffix, PRIVATE_REGISTRY, npmExec } from "./npm";

export async function spawnResourceTool(ctx: Context, command: string) {
  const packageName = `@gm-tools/resource-tool-${getPlatformSuffix()}`;

  const exeName =
    process.platform === "win32" ? "ResourceTool.exe" : "ResourceTool";
  const toolPathSuffix =
    process.platform === "darwin"
      ? ctx.path.join(
          "lib",
          "node_modules",
          packageName,
          "Contents",
          "MacOS",
          exeName,
        )
      : ctx.path.join("lib", "node_modules", packageName, exeName);

  const toolPath = `.${path.sep}${toolPathSuffix}`;

  const fullCommand = toolPath + " " + command;

  await npmExec(ctx, {
    packageName,
    command: "node",
    args: ["-p", `path.dirname(require.resolve(\"${packageName}\"))`],
    registry: PRIVATE_REGISTRY,
  });
}
