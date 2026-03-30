import path from "path";
import type { Context } from "./context";
import type { Log } from "./log";

const IGOR_ZIPS: Record<string, Record<string, string>> = {
  win32: {
    x64: "https://gms.yoyogames.com/igor_win-x64.zip",
    arm64: "https://gms.yoyogames.com/igor_win-arm64.zip",
  },
  linux: {
    x64: "https://gms.yoyogames.com/igor_linux-x64.zip",
    arm: "https://gms.yoyogames.com/igor_linux-arm.zip",
    arm64: "https://gms.yoyogames.com/igor_linux-arm64.zip",
  },
  darwin: {
    x64: "https://gms.yoyogames.com/igor_osx-x64.zip",
    arm64: "https://gms.yoyogames.com/igor_osx-arm64.zip",
  },
};

const IGOR_PLATFORM_DIRS: Record<string, string> = {
  win32: "windows",
  linux: "linux",
  darwin: "osx",
};

export async function downloadIgor(
  ctx: Context,
  { destDir, log }: { destDir: string; log: Log },
): Promise<string> {
  const platform = process.platform;
  const arch = process.arch;
  const platformDir = IGOR_PLATFORM_DIRS[platform] ?? platform;
  const exeName = platform === "win32" ? "Igor.exe" : "Igor";
  const igorPath = ctx.path.join(destDir, platformDir, arch, exeName);

  try {
    await ctx.fs.access(igorPath);
    return igorPath;
  } catch {
    // not yet downloaded
  }

  const platformZips = IGOR_ZIPS[platform];
  if (!platformZips) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const url = platformZips[arch];
  if (!url) {
    throw new Error(`Unsupported architecture for ${platform}: ${arch}`);
  }

  const response = await fetch(url, {
    headers: { "User-Agent": "gm-cli" },
  });
  if (!response.ok) {
    throw new Error(
      `Failed to download Igor: ${response.status} ${response.statusText}`,
    );
  }

  await ctx.fs.mkdir(destDir, { recursive: true });

  const zipPath = ctx.path.join(destDir, "igor.zip");
  const buffer = Buffer.from(await response.arrayBuffer());
  await ctx.fs.writeFile(zipPath, buffer);

  const unzipOutput = ctx.child_process.execSync(
    `unzip -o ${JSON.stringify(zipPath)} -d ${JSON.stringify(destDir)}`,
    {
      encoding: "utf-8",
    },
  );
  for (const line of unzipOutput.split("\n")) {
    if (line) log.message(line);
  }

  await ctx.fs.unlink(zipPath);

  if (platform !== "win32") {
    await ctx.fs.chmod(igorPath, 0o755);
  }

  return igorPath;
}

// Maybe more, https://github.com/YoYoGames/GameMaker/blob/develop/Zeus/Igor/Targets.cs
export const IGOR_TARGETS = [
  "OperaGX",
  "Windows",
  "Mac",
  "Linux",
  "HTML5",
  "ios",
  "Android",
  "tvos",
  "ps4",
  "ps5",
  "XBoxOne",
  "XBoxOneSeriesXS",
  "Switch",
] as const;

export type IgorTarget = (typeof IGOR_TARGETS)[number];

export function defaultTarget(platform: NodeJS.Platform): IgorTarget {
  switch (platform) {
    case "win32":
      return "Windows";
    case "darwin":
      return "Mac";
    case "linux":
      return "Linux";
    default:
      throw new Error(`No default target for platform: ${platform}`);
  }
}

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

// Mirrors StopProgram.KillList from C# IDE
const KILL_LIST = [
  "Mac_Runner",
  "Runner",
  "runner",
  "WinUAPRunner",
  "GameMakerPlayer",
  "ffmpeg",
  "GMDebug",
  "GMWebServer",
  "GMAssetCompiler",
  "Igor",
  "adb",
  "gmrt",
  "gmrtdebugger",
];

// Mirrors StopMacProcesses from C#:
// For each name in the kill list, find matching processes via ps and kill their trees.
function stopMacProcesses(ctx: Context): void {
  for (const name of KILL_LIST) {
    // macOS truncates process names to 15 characters
    const truncated = process.platform === "darwin" ? name.slice(0, 15) : name;
    const escaped = truncated.replace(/'/g, "\\'").replace(/ /g, "\\ ");

    let psOutput: string;
    try {
      psOutput = ctx.child_process.execSync(
        `ps -ww -eo pid,args | grep ${escaped}`,
        {
          encoding: "utf-8",
        },
      );
    } catch {
      continue;
    }

    for (const line of psOutput.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Skip the grep process itself
      if (trimmed.includes("grep")) continue;

      const pidStr = trimmed.match(/^(\d+)/)?.[1];
      if (!pidStr) continue;

      const pid = parseInt(pidStr, 10);
      killMacProcessTree(ctx, pid);
    }
  }
}

// Mirrors KillMacProcessTree from C#:
// recursively find children via pgrep -P, kill children first, then parent.
function killMacProcessTree(ctx: Context, pid: number): void {
  try {
    const children = ctx.child_process
      .execSync(`pgrep -P ${pid}`, {
        encoding: "utf-8",
      })
      .trim();
    for (const line of children.split("\n")) {
      const childPid = parseInt(line.trim(), 10);
      if (!isNaN(childPid)) {
        killMacProcessTree(ctx, childPid);
      }
    }
  } catch {
    // pgrep exits non-zero when no children found
  }

  try {
    process.kill(pid, "SIGKILL");
  } catch {
    // process already exited
  }
}

// Mirrors StopWindowsProcesses from C#:
// enumerate all processes, kill any whose name is in the kill list.
function stopWindowsProcesses(ctx: Context): void {
  let tasklist: string;
  try {
    tasklist = ctx.child_process.execSync("tasklist /FO CSV /NH", {
      encoding: "utf-8",
    });
  } catch {
    return;
  }

  for (const line of tasklist.split("\n")) {
    // CSV format: "name.exe","PID",...
    const match = line.match(/^"([^"]+)","(\d+)"/);
    if (!match) continue;

    const [, processName, pidStr] = match as RegExpMatchArray;
    const nameNoExt = processName!.replace(/\.exe$/i, "");
    if (!KILL_LIST.includes(nameNoExt)) continue;

    try {
      ctx.child_process.execSync(`taskkill /T /F /PID ${pidStr}`, {
        stdio: "ignore",
      });
    } catch {
      // process already exited
    }
  }
}

function stopProcesses(ctx: Context): void {
  if (process.platform === "win32") {
    stopWindowsProcesses(ctx);
  } else {
    stopMacProcesses(ctx);
  }
}

export function installRuntime(
  ctx: Context,
  {
    igorPath,
    runtimeDir,
    licenseFile,
    log,
  }: {
    igorPath: string;
    runtimeDir: string;
    licenseFile: string;
    log: Log;
  },
): Promise<void> {
  const args = ["Runtime", "Install", "-lf", licenseFile, "-rp", runtimeDir];

  return new Promise<void>((resolve, reject) => {
    const child = ctx.child_process.spawn(igorPath, args, {
      stdio: ["inherit", "pipe", "pipe"],
      env:
        process.platform === "darwin"
          ? { ...process.env, COMPlus_ZapDisable: "1" }
          : undefined,
    });

    const onData = (data: Buffer) => {
      for (const line of data.toString().split("\n")) {
        if (line) log.message(line);
      }
    };
    child.stdout?.on("data", onData);
    child.stderr?.on("data", onData);

    child.on("error", (err) => reject(err));

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Igor Runtime Install exited with code ${code}`));
      }
    });
  });
}

export function igorRun(
  ctx: Context,
  {
    igorPath,
    runtimeDir,
    target,
    cacheDir,
    licenseFile,
    prefabsDir,
    projectPath,
    projectToolPath,
    verbose,
    log,
  }: {
    igorPath: string;
    licenseFile: string;
    prefabsDir: string;
    runtimeDir: string;
    target: IgorTarget;
    cacheDir: string;
    projectPath: string;
    projectToolPath: string;
    verbose: boolean;
    log: Log;
  },
): Promise<void> {
  const outputFile = path.join(cacheDir, "output", "outputFile");
  const args = [
    "-rp",
    runtimeDir,
    "-cache",
    cacheDir,
    "-project",
    projectPath,
    "-of",
    outputFile,
    "-lf",
    licenseFile, // FIXME: should not be needed but asset compiler requires it
    "-prefabs",
    prefabsDir,
    ...(verbose ? ["-v"] : []),
    "-projectool",
    projectToolPath,
    "--",
    target,
    "Run",
  ];

  return new Promise<void>((resolve, reject) => {
    const child = ctx.child_process.spawn(igorPath, args, {
      stdio: ["inherit", "pipe", "pipe"],
      env:
        process.platform === "darwin"
          ? { ...process.env, COMPlus_ZapDisable: "1" }
          : undefined,
    });

    const onData = (data: Buffer) => {
      for (const line of data.toString().split("\n")) {
        if (line) log.message(line);
      }
    };
    child.stdout?.on("data", onData);
    child.stderr?.on("data", onData);

    const onSignal = () => {
      stopProcesses(ctx);
    };

    process.on("SIGINT", onSignal);
    process.on("SIGTERM", onSignal);

    child.on("error", (err) => {
      process.removeListener("SIGINT", onSignal);
      process.removeListener("SIGTERM", onSignal);
      reject(err);
    });

    child.on("close", (code) => {
      process.removeListener("SIGINT", onSignal);
      process.removeListener("SIGTERM", onSignal);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Igor exited with code ${code}`));
      }
    });
  });
}
