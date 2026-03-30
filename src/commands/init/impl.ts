import * as p from "@clack/prompts";
import type { Context } from "../../context";
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
      this.process.stderr.write(
        "Error: --name is required in non-interactive mode\n",
      );
      this.process.exit(1);
    }
    if (!flags.template) {
      this.process.stderr.write(
        "Error: --template is required in non-interactive mode\n",
      );
      this.process.exit(1);
    }

    const validationError = validateProjectName(flags.name);
    if (validationError) {
      this.process.stderr.write(`Error: ${validationError}\n`);
      this.process.exit(1);
    }

    const matchedTemplate = findTemplate(templates, flags.template);
    if (!matchedTemplate) {
      this.process.stderr.write(
        `Error: Template "${flags.template}" not found\n`,
      );
      this.process.exit(1);
    }

    config = {
      projectName: flags.name,
      template: matchedTemplate.id,
      createClaude: flags.claude,
    };

    console.log("Creating project...");
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
    const projectDir = await scaffoldProject(selectedTemplate, config);
    s.stop(`Template extracted to ${projectDir}`);

    if (flags.interactive) {
      p.outro(`Project created!`);
    } else {
      console.log(`Project created at ${projectDir}`);
    }
  } catch (error) {
    s.stop("Failed");
    throw error;
  }
}
