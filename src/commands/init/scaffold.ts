import type { Template } from "./types";
import type { Context } from "../../context";
import { KnownError } from "../../error";

export async function scaffoldProject(
  ctx: Context,
  template: Template & { kind: "download" },
  projectName: string,
) {
  const response = await fetch(template.downloadUrl);
  if (!response.ok) {
    throw new KnownError(`Failed to download template: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();

  const projectDir = ctx.path.join(ctx.process.cwd(), projectName);
  const zipPath = ctx.path.join(ctx.process.cwd(), `${projectName}.zip`);

  await ctx.fs.writeFile(zipPath, Buffer.from(buffer));
  await ctx.fs.mkdir(projectDir, { recursive: true });

  // FIXME: use a cross platform util instead of just spawning here
  ctx.child_process.execSync(`unzip -q "${zipPath}" -d "${projectDir}"`);
  await ctx.fs.unlink(zipPath);

  return projectDir;
}
