import type { Cache } from "./cache";
import type { Context } from "./context";
import type { Log } from "./log";
import type { ProjectPath } from "./project";

export async function restorePrefabs(
  ctx: Context,
  cache: Cache,
  log: Log,
  {
    projectToolPath,
    projectPath,
    packageToolPath,
    gmpmPath,
    verbose,
  }: {
    projectToolPath: string;
    projectPath: ProjectPath;
    packageToolPath: string;
    verbose: boolean;
    gmpmPath: string;
  },
): Promise<void> {
  const prefabsDir = await cache.getSubDirPath(ctx, "prefabs");
  return new Promise<void>((resolve, reject) => {
    // TODO LATER: add options to pick registry etc.
    const args = [
      "PREFABS",
      "RESTORE",
      `SOURCE=${projectPath}`,
      `PACKAGETOOL=${packageToolPath}`,
      `GMPM_DLL=${gmpmPath}`,
      `PACKAGETOOLVERBOSE=${verbose ? "TRUE" : "FALSE"}`,
      `PREFABSFOLDER=${prefabsDir}`,
    ];
    const child = ctx.child_process.spawn(projectToolPath, args, {
      stdio: ["inherit", "pipe", "pipe"],
      env:
        ctx.process.platform === "darwin"
          ? { ...ctx.process.env, COMPlus_ZapDisable: "1" }
          : undefined,
    });

    child.stdout.on("data", (data: Buffer) => {
      for (const line of data.toString().split("\n")) {
        if (line) {
          log.message(line);
        }
      }
    });
    child.stderr.on("data", (data: Buffer) => {
      for (const line of data.toString().split("\n")) {
        if (line) {
          log.message(line);
        }
      }
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0 || code === null) {
        resolve();
      } else {
        reject(
          new Error(
            `ProjectTool PREFABS RESTORE exited with code ${String(code)}`,
          ),
        );
      }
    });
  });
}
