import { gitignore, gitattributes, claudemd } from "./base-files";
import type { Template, ProjectConfig } from "./types";
import type { Context } from "../../context";
import { KnownError } from "../../error";

export async function scaffoldProject(
  ctx: Context,
  template: Template,
  config: ProjectConfig,
) {
  const response = await fetch(template.downloadUrl);
  if (!response.ok) {
    throw new KnownError(`Failed to download template: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();

  const projectDir = ctx.path.join(ctx.process.cwd(), config.projectName);
  const zipPath = ctx.path.join(ctx.process.cwd(), `${config.projectName}.zip`);

  await ctx.fs.writeFile(zipPath, Buffer.from(buffer));
  await ctx.fs.mkdir(projectDir, { recursive: true });

  // FIXME: use a cross platform util instead of just spawning here
  ctx.child_process.execSync(`unzip -q "${zipPath}" -d "${projectDir}"`);
  await ctx.fs.unlink(zipPath);

  await ctx.fs.writeFile(ctx.path.join(projectDir, ".gitignore"), gitignore);
  await ctx.fs.writeFile(ctx.path.join(projectDir, ".gitattributes"), gitattributes);

  if (config.createClaude) {
    await ctx.fs.writeFile(ctx.path.join(projectDir, "CLAUDE.md"), claudemd);
  }

  return projectDir;
}
