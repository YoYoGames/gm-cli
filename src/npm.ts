import type { Context } from "./context";
import type { Log } from "./log";

const PLATFORM_SUFFIXES: Record<string, Record<string, string>> = {
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

export function getPlatformSuffix(ctx: Context): string {
  const platform = ctx.process.platform;
  const arch = ctx.process.arch;

  const platformNames = PLATFORM_SUFFIXES[platform];
  if (!platformNames) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const suffix = platformNames[arch];
  if (!suffix) {
    throw new Error(`Unsupported architecture for ${platform}: ${arch}`);
  }

  return suffix;
}

export const REGISTRY = "https://gmpm.gamemaker.io";
export const PRIVATE_REGISTRY = "https://gmpm-private.gamemaker.io";

function cmd(ctx: Context, name: string, args: string[]): [string, string[]] {
  if (ctx.process.platform === "win32") {
    return ["cmd.exe", ["/c", `${name}.cmd`, ...args]];
  }
  return [name, args];
}

export function npmExec(
  ctx: Context,
  {
    packageName,
    registry,
    args,
    extraEnvVars,
    ignoreStdio,
  }: {
    registry: string;
    packageName: string;
    args: string[];
    extraEnvVars?: Record<string, string>;
    ignoreStdio?: boolean;
  },
): Promise<void> {
  const fullArgs = ["--yes", "--registry", registry, packageName, ...args];

  return new Promise<void>((resolve, reject) => {
    const [npxCmd, npxArgs] = cmd(ctx, "npx", fullArgs);
    const child = ctx.child_process.spawn(npxCmd, npxArgs, {
      stdio: ignoreStdio ? "ignore" : "inherit",
      env: { ...ctx.process.env, ...extraEnvVars },
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`npm exec failed with code ${String(code)}`));
      } else {
        resolve();
      }
    });
  });
}

export function npmInstall(
  ctx: Context,
  log: Log,
  {
    prefix,
    packageName,
    registry,
    verbose,
  }: {
    prefix: string;
    packageName: string;
    registry: string;
    verbose?: boolean;
  },
): Promise<void> {
  const args = [
    "--registry",
    registry,
    "--no-save",
    ...(verbose ? ["--verbose"] : []),
    "--no-package-lock",
    "--global",
    "--prefix",
    prefix,
    "install",
    packageName,
  ];

  return new Promise<void>((resolve, reject) => {
    const [npmCmd, npmArgs] = cmd(ctx, "npm", args);
    const child = ctx.child_process.spawn(npmCmd, npmArgs, {
      stdio: ["inherit", "pipe", "pipe"],
    });

    const onData = (data: Buffer) => {
      for (const line of data.toString().split("\n")) {
        if (line) log.message(line);
      }
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);

    child.on("error", (err) => { reject(err); });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`npm install exited with code ${String(code)}`));
      }
    });
  });
}
