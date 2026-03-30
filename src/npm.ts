import type { Context } from "./context";

const REGISTRY = "https://gmpm.gamemaker.io";

export function npmInstall(
  ctx: Context,
  {
    prefix,
    packageName,
    verbose,
  }: {
    prefix: string;
    packageName: string;
    verbose?: boolean;
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
    // TODO: Do we really care about streaming the output? Could just wait until it's completed
    const child = ctx.child_process.spawn("npm", args, {
      stdio: "inherit",
    });

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
