import type { Context } from "./context";
import type { Log } from "./log";
import { npmInstall, getPlatformSuffix, PRIVATE_REGISTRY } from "./npm";

export async function downloadResourceTool(
  ctx: Context,
  { destDir, log, verbose }: { destDir: string; log: Log; verbose: boolean },
): Promise<string> {
  const packageName = `@gm-tools/resource-tool-${getPlatformSuffix()}`;
  const exeName =
    process.platform === "win32" ? "ResourceTool.exe" : "ResourceTool";
  const toolPath =
    process.platform === "darwin"
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
    registry: PRIVATE_REGISTRY,
    verbose,
  });

  if (process.platform !== "win32") {
    await ctx.fs.chmod(toolPath, 0o755);
  }

  return toolPath;
}
