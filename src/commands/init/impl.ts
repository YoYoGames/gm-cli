import * as p from "@clack/prompts";
import { type Context, exists } from "../../context";
import { Cache } from "../../cache";
import { KnownError } from "../../error";
import { callResourceTool } from "../../resourceTool";
import { gitignore, gitattributes, claudemd } from "./base-files";
import { getTemplates } from "./get-templates";
import { runInteractive } from "./prompts";
import { scaffoldProject } from "./scaffold";
import { validateProjectName, findTemplate } from "./validation";
import type { ProjectConfig } from "./types";

interface InitCommandFlags {
  interactive: boolean;
  name?: string;
  template?: string;
  claude: boolean;
  cacheDir?: string;
}

export default async function (
  this: Context,
  flags: InitCommandFlags,
): Promise<void> {
  const templates = await getTemplates();

  let config: ProjectConfig;

  if (!flags.interactive) {
    if (!flags.name) {
      throw new KnownError("--name is required in non-interactive mode");
    }
    if (!flags.template) {
      throw new KnownError("--template is required in non-interactive mode");
    }

    const validationError = validateProjectName(flags.name);
    if (validationError) {
      throw new KnownError(validationError);
    }

    const matchedTemplate = findTemplate(templates, flags.template);
    if (!matchedTemplate) {
      throw new KnownError(`Template "${flags.template}" not found`);
    }

    config = {
      projectName: flags.name,
      template: matchedTemplate.id,
      createClaude: flags.claude,
    };

    this.process.stdout.write("Creating project...\n");
  } else {
    config = await runInteractive(
      { name: flags.name, claude: flags.claude },
      templates,
    );
  }

  const projectDir = this.path.join(this.process.cwd(), config.projectName);
  if (await exists(this, projectDir)) {
    throw new KnownError(`Directory "${config.projectName}" already exists`);
  }

  const selectedTemplate = findTemplate(templates, config.template);
  if (!selectedTemplate) {
    throw new Error(`Template "${config.template}" not found`);
  }

  const s = p.spinner();

  try {
    if (selectedTemplate.kind === "blank") {
      s.start("Creating blank project");
      await this.fs.mkdir(projectDir, { recursive: true });
      await callResourceTool(this, {
        ignoreStdio: true,
        run: {
          mode: "command",
          command: `resource project create name="${config.projectName}" path="${projectDir}"`,
        },
      });
    } else {
      s.start("Downloading template");
      s.message("Extracting template");
      const cache = await Cache.getOrInit(
        this,
        flags.cacheDir ?? this.path.join(projectDir, ".gmcache"),
      );
      await scaffoldProject(this, selectedTemplate, {
        name: config.projectName,
        dir: projectDir,
      }, cache);
    }

    s.message("Creating base files");
    await this.fs.writeFile(
      this.path.join(projectDir, ".gitignore"),
      gitignore,
    );
    await this.fs.writeFile(
      this.path.join(projectDir, ".gitattributes"),
      gitattributes,
    );
    if (config.createClaude) {
      await this.fs.writeFile(
        this.path.join(projectDir, "CLAUDE.md"),
        claudemd,
      );
    }
    s.stop(`Project created at ${projectDir}`);

    if (flags.interactive) {
      p.outro(`Project created!`);
    }
  } catch (error) {
    s.stop("Failed");
    throw error;
  }
}
