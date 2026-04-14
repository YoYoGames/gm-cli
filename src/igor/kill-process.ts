import type { Context } from "../context";

export function stopProcesses(ctx: Context): void {
  if (ctx.process.platform === "win32") {
    stopWindowsProcesses(ctx);
  } else {
    stopMacProcesses(ctx);
  }
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
    const truncated =
      ctx.process.platform === "darwin" ? name.slice(0, 15) : name;
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

      const pidStr = /^(\d+)/.exec(trimmed)?.[1];
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
      .execSync(`pgrep -P ${String(pid)}`, {
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
    ctx.process.kill(pid, "SIGKILL");
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
    const match = /^"([^"]+)","(\d+)"/.exec(line);
    if (!match) continue;

    const [, processName, pidStr] = match;
    if (!processName || !pidStr) {
      continue;
    }
    const nameNoExt = processName.replace(/\.exe$/i, "");
    if (!KILL_LIST.includes(nameNoExt)) {
      continue;
    }

    try {
      ctx.child_process.execSync(`taskkill /T /F /PID ${pidStr}`, {
        stdio: "ignore",
      });
    } catch {
      // process already exited
    }
  }
}
