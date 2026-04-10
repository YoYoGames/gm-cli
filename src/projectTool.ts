import type { Cache } from "./cache";
import type { Context } from "./context";
import type { Log } from "./log";
import { npmInstall, getPlatformSuffix, REGISTRY } from "./npm";

export async function downloadProjectTool(
  ctx: Context,
  { cache, log, verbose }: { cache: Cache; log: Log; verbose: boolean },
): Promise<string> {
  const destDir = await cache.getSubDirPath(ctx, "project-tool");
  const platformSuffix = getPlatformSuffix(ctx);
  const packageName = `@gm-tools/project-tool-${platformSuffix}`;
  const exeName =
    ctx.process.platform === "win32" ? "ProjectTool.exe" : "ProjectTool";
  const toolPath =
    ctx.process.platform === "darwin"
      ? ctx.path.join(
          destDir,
          "lib",
          "node_modules",
          packageName,
          "Contents",
          "MacOS",
          exeName,
        )
      : ctx.path.join(destDir, "lib", "node_modules", packageName, exeName);

  try {
    await ctx.fs.access(toolPath);
    return toolPath;
  } catch {
    // not yet downloaded
  }

  await npmInstall(ctx, log, {
    prefix: destDir,
    packageName,
    registry: REGISTRY,
    verbose,
  });

  if (ctx.process.platform !== "win32") {
    await ctx.fs.chmod(toolPath, 0o755);
  }

  return toolPath;
}
