import type { Context } from "./context";
import type { Log } from "./log";

const REGISTRY = "https://gmpm.gamemaker.io";

export function npmInstall(
  ctx: Context,
  {
    prefix,
    packageName,
    verbose,
    log,
  }: {
    prefix: string;
    packageName: string;
    verbose?: boolean;
    log: Log;
  },
): Promise<void> {
  const args = [
    "--registry",
    REGISTRY,
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
    const child = ctx.child_process.spawn("npm", args, {
      stdio: ["inherit", "pipe", "pipe"],
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
        reject(new Error(`npm install exited with code ${code}`));
      }
    });
  });
}
