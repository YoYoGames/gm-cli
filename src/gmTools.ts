import type { Cache } from "./cache";
import { exists, type Context } from "./context";
import type { Log } from "./log";
import {
  npmInstall,
  getPlatformSuffix,
  PRIVATE_REGISTRY,
  type PlatformSuffixes,
} from "./npm";

export async function downloadProjectTool(
  ctx: Context,
  cache: Cache,
  log: Log,
  options: { verbose: boolean },
) {
  return download(
    ctx,
    "project-tool",
    cache,
    log,
    options,
    (destDir, packageName) => {
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
    },
  );
}

export async function downloadGmpm(
  ctx: Context,
  cache: Cache,
  log: Log,
  { verbose }: { verbose: boolean },
) {
  return download(
    ctx,
    "gmpm",
    cache,
    log,
    {
      verbose,
      // Note: GMRT relies on GMPM using the mac- suffix instead of osx- like most other @gm-tools
      platformSuffixOverride: {
        darwin: { arm64: "mac-arm64", x64: "mac-arm64" },
      },
    },
    (destDir, packageName) => {
      // Note: we only want the DLL file (regardless of platform)
      if (ctx.process.platform === "darwin") {
        return ctx.path.join(
          destDir,
          "lib",
          "node_modules",
          packageName,
          "bundle",
          "Contents",
          "MacOS",
          "gmpm.dll",
        );
      }
      if (ctx.process.platform === "win32") {
        return ctx.path.join(destDir, "node_modules", packageName, "gmpm.dll");
      }
      return ctx.path.join(
        destDir,
        "lib",
        "node_modules",
        packageName,
        "gmpm.dll",
      );
    },
  );
}

export async function downloadPackageTool(
  ctx: Context,
  cache: Cache,
  log: Log,
  options: { verbose: boolean },
) {
  return download(
    ctx,
    "package-tool",
    cache,
    log,
    options,
    (destDir, packageName) => {
      switch (ctx.process.platform) {
        case "darwin":
          return ctx.path.join(
            destDir,
            "lib",
            "node_modules",
            packageName,
            "Contents",
            "MacOS",
            "PackageTool",
          );
        case "win32":
          return ctx.path.join(
            destDir,
            "node_modules",
            packageName,
            "PackageTool.exe",
          );
        default:
          return ctx.path.join(
            destDir,
            "lib",
            "node_modules",
            packageName,
            "PackageTool",
          );
      }
    },
  );
}

async function download(
  ctx: Context,
  name: string,
  cache: Cache,
  log: Log,
  {
    verbose,
    platformSuffixOverride,
  }: {
    verbose: boolean;
    platformSuffixOverride?: {
      [K in keyof PlatformSuffixes]?: Partial<PlatformSuffixes[K]>;
    };
  },
  getPath: (destDir: string, packageName: string) => string,
): Promise<string> {
  const destDir = await cache.getSubDirPath(ctx, name);
  const platformSuffix = getPlatformSuffix(ctx, platformSuffixOverride);
  const packageName = `@gm-tools/${name}-${platformSuffix}`;
  const toolPath = getPath(destDir, packageName);

  if (await exists(ctx, toolPath)) {
    return toolPath;
  }
  // not yet downloaded

  await npmInstall(ctx, log, {
    prefix: destDir,
    packageName,
    registry: PRIVATE_REGISTRY,
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
