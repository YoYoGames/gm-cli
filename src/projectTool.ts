import type { Context } from "./context";
import { npmInstall } from "./npm";

const PLATFORM_NAMES: Record<string, Record<string, string>> = {
  win32: {
    x64: "win-x64",
  },
  linux: {
    x64: "linux-x64",
    arm64: "linux-arm64",
  },
  darwin: {
    x64: "osx-x64",
    arm64: "osx-arm64",
  },
};

// TODO: would be nice if this was packaged as one package with optional
// dependencies and just having npm deal with it.
function getPackageName(): string {
  const platform = process.platform;
  const arch = process.arch;

  const platformNames = PLATFORM_NAMES[platform];
  if (!platformNames) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const suffix = platformNames[arch];
  if (!suffix) {
    throw new Error(`Unsupported architecture for ${platform}: ${arch}`);
  }

  return `@gm-tools/project-tool-${suffix}`;
}

export async function downloadProjectTool(
  ctx: Context,
  destDir: string,
): Promise<string> {
  const packageName = getPackageName();
  const exeName =
    process.platform === "win32" ? "ProjectTool.exe" : "ProjectTool";
  const toolPath =
    process.platform === "darwin"
      ? ctx.path.join(destDir, "lib", "node_modules", packageName, "Contents", "MacOS", exeName)
      : ctx.path.join(destDir, "lib", "node_modules", packageName, exeName);

  try {
    await ctx.fs.access(toolPath);
    return toolPath;
  } catch {
    // not yet downloaded
  }

  await npmInstall(ctx, {
    prefix: destDir,
    packageName,
  });

  if (process.platform !== "win32") {
    await ctx.fs.chmod(toolPath, 0o755);
  }

  return toolPath;
}
