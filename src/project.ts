import type { Context } from "./context";
import { KnownError } from "./error";

export type ProjectPath = string & { readonly __brand: unique symbol };

export function parseProjectPath(s: string): ProjectPath {
  if (!s.endsWith(".yyp")) {
    throw new KnownError(`Expected a file with the .yyp extension.`);
  }
  return s as ProjectPath;
}

export async function findProjectFile(
  ctx: Context,
  dir: string,
): Promise<ProjectPath> {
  const files = await ctx.fs.readdir(dir);
  const yypFile = files.find((f: string) => f.endsWith(".yyp"));
  if (!yypFile) {
    throw new KnownError("No .yyp project file found in the current directory");
  }
  return ctx.path.join(dir, yypFile) as ProjectPath;
}

export function getProjectName(ctx: Context, projectPath: ProjectPath) {
  return ctx.path.basename(projectPath, ".yyp");
}