import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";
import { gitignore, gitattributes, claudemd } from "./base-files";
import type { Template, ProjectConfig } from "./types";
import { KnownError } from "../../error";

export async function scaffoldProject(
  template: Template,
  config: ProjectConfig,
) {
  const response = await fetch(template.downloadUrl);
  if (!response.ok) {
    throw new KnownError(`Failed to download template: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();

  const projectDir = path.join(process.cwd(), config.projectName);
  const zipPath = path.join(process.cwd(), `${config.projectName}.zip`);

  await fs.writeFile(zipPath, Buffer.from(buffer));
  await fs.mkdir(projectDir, { recursive: true });

  execSync(`unzip -q "${zipPath}" -d "${projectDir}"`);
  await fs.unlink(zipPath);

  await fs.writeFile(path.join(projectDir, ".gitignore"), gitignore);
  await fs.writeFile(path.join(projectDir, ".gitattributes"), gitattributes);

  if (config.createClaude) {
    await fs.writeFile(path.join(projectDir, "CLAUDE.md"), claudemd);
  }

  return projectDir;
}
