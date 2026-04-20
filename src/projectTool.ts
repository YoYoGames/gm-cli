import type { Cache } from "./cache";
import { exists, type Context } from "./context";
import type { Log } from "./log";
import { npmInstall, getPlatformSuffix, REGISTRY } from "./npm";

function getToolPath(
  ctx: Context,
  { destDir, packageName }: { destDir: string; packageName: string },
): string {
  switch (ctx.process.platform) {
    case "darwin":
      return ctx.path.join(
        destDir,
        "lib",
        "node_modules",
        packageName,
        "Contents",
        "MacOS",
        "ProjectTool",
      );
    case "win32":
      return ctx.path.join(
        destDir,
        "node_modules",
        packageName,
        "ProjectTool.exe",
      );
    default:
      return ctx.path.join(
        destDir,
        "lib",
        "node_modules",
        packageName,
        "ProjectTool",
      );
  }
}

export async function downloadProjectTool(
  ctx: Context,
  { cache, log, verbose }: { cache: Cache; log: Log; verbose: boolean },
): Promise<string> {
  const destDir = await cache.getSubDirPath(ctx, "project-tool");
  const platformSuffix = getPlatformSuffix(ctx);
  const packageName = `@gm-tools/project-tool-${platformSuffix}`;
  const toolPath = getToolPath(ctx, { destDir, packageName });

  if (await exists(ctx, toolPath)) {
    return toolPath;
  }
  // not yet downloaded

  await npmInstall(ctx, log, {
    prefix: destDir,
    packageName,
    registry: REGISTRY,
    verbose,
  });

  if (!(await exists(ctx, toolPath))) {
    throw new Error(`Expected to find ${packageName} at path ${toolPath}`);
  }

  if (ctx.process.platform !== "win32") {
    await ctx.fs.chmod(toolPath, 0o755);
  }

  return toolPath;
}
