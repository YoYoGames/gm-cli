import * as p from "@clack/prompts";
import { validateProjectName } from "./validation";
import type { Template, ProjectConfig } from "./types";

interface ArgvOptions {
  name?: string;
  ai?: boolean;
  actions?: boolean;
}

export async function runInteractive(
  argv: ArgvOptions,
  templates: Template[],
): Promise<ProjectConfig> {
  p.intro(`Create a GameMaker project`);

  const answers = await p.group(
    {
      projectName: () =>
        p.text({
          message: "What's your project name?",
          placeholder: "my-awesome-game",
          defaultValue: argv.name,
          validate: (value) => validateProjectName(value ?? ""),
        }),
      projectType: async () => {
        const types = [...new Set(templates.map((t) => t.type))].sort();

        return p.select({
          message: "What type of project?",
          options: types.map((type) => ({ value: type, label: type })),
        });
      },
      template: async ({ results }) => {
        const filtered = templates
          .filter(({ type }) => type === results.projectType)
          .sort((a, b) => a.title.localeCompare(b.title));

        return p.select({
          message: "Pick a template",
          options: filtered.map(({ id, title }) => ({
            value: id,
            label: title
              .replace(/ Template$/, "")
              .replace(/ Live Wallpaper$/, "")
              .replace(/ Game Strip$/, ""),
          })),
        });
      },
      useAi: () =>
        p.confirm({
          message: "Set up AI scaffolding (MCP, CLAUDE.md, etc.)",
          initialValue: argv.ai ?? true,
        }),
      useActions: () =>
        p.confirm({
          message: "Set up GitHub Actions workflows",
          initialValue: argv.actions ?? true,
        }),
    },
    {
      onCancel: () => {
        process.exit(0);
      },
    },
  );

  return {
    projectName: answers.projectName,
    template: answers.template as string,
    useAi: answers.useAi,
    useActions: answers.useActions,
  };
}
