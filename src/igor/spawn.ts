import path from "path";
import type { Context } from "../context";
import type { Log } from "../log";
import { type Module, type Target } from "./target";
import type { ProjectPath } from "../project";

export async function findRuntimeLocation(
  ctx: Context,
  runtimeDir: string,
): Promise<string> {
  const entries = await ctx.fs.readdir(runtimeDir);
  const subdir = entries[0]; // FIXME: pick the most recent runtime? Or given an error an ask the user to clearify?
  if (!subdir) {
    throw new Error(`No runtime found in ${runtimeDir}`);
  }
  return path.join(runtimeDir, subdir);
}

export function spawnIgor(
  ctx: Context,
  log: Log,
  {
    igorPath,
    args,
    label,
    onSignal,
  }: {
    igorPath: string;
    args: string[];
    label: string;
    onSignal?: () => void;
  },
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const child = ctx.child_process.spawn(igorPath, args, {
      stdio: ["inherit", "pipe", "pipe"],
      env:
        ctx.process.platform === "darwin"
          ? { ...ctx.process.env, COMPlus_ZapDisable: "1" }
          : undefined,
    });

    const onData = (data: Buffer) => {
      for (const line of data.toString().split("\n")) {
        if (line) log.message(line);
      }
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);

    if (onSignal) {
      ctx.process.on("SIGINT", onSignal);
      ctx.process.on("SIGTERM", onSignal);
    }

    child.on("error", (err) => {
      if (onSignal) {
        ctx.process.removeListener("SIGINT", onSignal);
        ctx.process.removeListener("SIGTERM", onSignal);
      }
      reject(err);
    });

    child.on("close", (code) => {
      if (onSignal) {
        ctx.process.removeListener("SIGINT", onSignal);
        ctx.process.removeListener("SIGTERM", onSignal);
      }
      if (code === 0 || code === null) {
        resolve();
      } else {
        reject(new Error(`${label} exited with code ${String(code)}`));
      }
    });
  });
}

export function fetchLicense(
  ctx: Context,
  log: Log,
  {
    igorPath,
    accessKey,
    outputFile,
  }: {
    igorPath: string;
    accessKey: string;
    outputFile: string;
  },
): Promise<void> {
  return spawnIgor(ctx, log, {
    igorPath,
    args: ["Runtime", "FetchLicense", `-ak=${accessKey}`, `-of=${outputFile}`],
    label: "Igor Runtime FetchLicense",
  });
}

// FIXME: should we run Runtime Verify [-folder=.] ?
export function installRuntime(
  ctx: Context,
  log: Log,
  {
    modules,
    igorPath,
    runtimeDir,
    licenseFile,
  }: {
    modules?: Module[];
    igorPath: string;
    runtimeDir: string;
    licenseFile: string;
  },
): Promise<void> {
  return spawnIgor(ctx, log, {
    igorPath,
    args: [
      "Runtime",
      "Install",
      "-lf",
      licenseFile,
      "-rp",
      runtimeDir,
      ...(modules ? ["-m", modules.join(",")] : []),
    ],
    label: "Igor Runtime Install",
  });
}

export interface CommonIgorBuildArgs {
  igorPath: string;
  licenseFile: string;
  prefabsDir: string;
  runtimeDir: string;
  target: Target;
  cacheDir: string;
  projectPath: ProjectPath;
  projectToolPath: string;
  verbose: boolean;
}

export function constructIgorBuildArgs(
  commonArgs: CommonIgorBuildArgs,
  action: string,
  extraArgs: string[] = [],
): string[] {
  const outputFile = path.join(commonArgs.cacheDir, "output", "outputFile");
  return [
    "-rp",
    commonArgs.runtimeDir,
    "-cache",
    commonArgs.cacheDir,
    "-project",
    commonArgs.projectPath,
    "-of",
    outputFile,
    "-lf",
    commonArgs.licenseFile, // FIXME: should not be needed but asset compiler requires it
    "-prefabs",
    commonArgs.prefabsDir,
    ...(commonArgs.verbose ? ["-v"] : []),
    "-projectool",
    commonArgs.projectToolPath,
    ...extraArgs,
    "--",
    commonArgs.target,
    action,
  ];
}
