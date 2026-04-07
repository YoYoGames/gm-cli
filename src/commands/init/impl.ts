import * as p from "@clack/prompts";
import type { Context } from "../../context";
import { KnownError } from "../../error";
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

  const selectedTemplate = findTemplate(templates, config.template);
  if (!selectedTemplate) {
    throw new Error(`Template "${config.template}" not found`);
  }

  const s = p.spinner();
  s.start("Downloading template");

  try {
    s.message("Extracting template");
    s.message("Creating base files");
    const projectDir = await scaffoldProject(this, selectedTemplate, config);
    s.stop(`Template extracted to ${projectDir}`);

    if (flags.interactive) {
      p.outro(`Project created!`);
    } else {
      this.process.stdout.write(`Project created at ${projectDir}\n`);
    }
  } catch (error) {
    s.stop("Failed");
    throw error;
  }
}
