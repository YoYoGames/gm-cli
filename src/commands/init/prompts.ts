/**
 * Copyright 2026, Opera Norway AS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at:
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
      toolchain: () => {
        return p.select({
          message: "Toolchain",
          options: [
            {
              value: { type: "GMS2" as const },
              label: "GMS2",
            },
            {
              value: { type: "GMRT" as const },
              label: "GMRT (Experimental)",
            },
          ],
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
    toolchain: answers.toolchain,
  };
}
