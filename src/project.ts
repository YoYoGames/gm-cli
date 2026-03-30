import type { Context } from "./context";

export async function findProjectFile(
  ctx: Context,
  dir: string,
): Promise<string> {
  const files = await ctx.fs.readdir(dir);
  const yypFile = files.find((f: string) => f.endsWith(".yyp"));
  if (!yypFile) {
    throw new Error("No .yyp project file found in the current directory");
  }
  return ctx.path.join(dir, yypFile);
}
