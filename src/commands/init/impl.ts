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
import { type Context, exists } from "~/context";
import { Cache } from "~/cache";
import { KnownError } from "~/error";
import { callResourceTool } from "~/resource-tool";
import { gitignore, gitattributes, compileYml, packageYml } from "./base-files";
import { getTemplates } from "./get-templates";
import { runInteractive } from "./prompts";
import { scaffoldProject } from "./scaffold";
import { validateProjectName, findTemplate } from "./validation";
import type { ProjectConfig } from "./types";
// @ts-expect-error — bundled as text by tsup/esbuild
import claudeContents from "./claude-contents.txt";
import { writeGmOptions } from "~/gm-options";
import type { ToolchainVersion } from "~/toolchain";

interface InitCommandFlags {
  interactive: boolean;
  name?: string;
  template?: string;
  ai: boolean;
  actions: boolean;
  toolchain?: ToolchainVersion;
  cacheDir?: string;
}

export default async function (
  this: Context,
  flags: InitCommandFlags,
): Promise<void> {
  const templates = await getTemplates(this);

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
      useAi: flags.ai,
      useActions: flags.actions,
      toolchain: flags.toolchain ?? { type: "GMS2" },
    };

    this.process.stdout.write("Creating project...\n");
  } else {
    config = await runInteractive(
      { name: flags.name, ai: flags.ai, actions: flags.actions },
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

  const cache = await Cache.initLazy(
    this,
    flags.cacheDir
      ? { type: "absolute", path: flags.cacheDir }
      : { type: "infer", projectDir },
  );

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
      await scaffoldProject(
        this,
        selectedTemplate,
        {
          name: config.projectName,
          dir: projectDir,
        },
        cache,
      );
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
    if (config.useAi) {
      await this.fs.writeFile(
        this.path.join(projectDir, "CLAUDE.md"),
        claudeContents as string,
      );
      await this.fs.writeFile(
        this.path.join(projectDir, "AGENTS.md"),
        claudeContents as string,
      );
      const claudeDir = this.path.join(projectDir, ".claude");
      await this.fs.mkdir(claudeDir, { recursive: true });
      await this.fs.writeFile(
        this.path.join(claudeDir, "settings.local.json"),
        JSON.stringify(
          {
            permissions: {
              allow: ["mcp__gamemaker-resource-tool"],
              deny: ["Edit(*.yy)", "Edit(*.yyp)"],
            },
            enabledMcpjsonServers: ["gamemaker-resource-tool"],
            enableAllProjectMcpServers: true,
          },
          null,
          2,
        ) + "\n",
      );
      const isWin = this.process.platform === "win32";
      await this.fs.writeFile(
        this.path.join(projectDir, ".mcp.json"),
        JSON.stringify(
          {
            mcpServers: {
              "gamemaker-resource-tool": {
                type: "stdio",
                ...(isWin
                  ? {
                      command: "cmd",
                      args: [
                        "/c",
                        "npx @gamemaker/gm-cli@latest resourcetool mcp",
                      ],
                    }
                  : {
                      command: "npx",
                      args: ["@gamemaker/gm-cli@latest", "resourcetool", "mcp"],
                    }),
                env: {},
              },
            },
          },
          null,
          2,
        ) + "\n",
      );
    }
    if (config.useActions) {
      const workflowsDir = this.path.join(projectDir, ".github", "workflows");
      await this.fs.mkdir(workflowsDir, { recursive: true });
      await this.fs.writeFile(
        this.path.join(workflowsDir, "compile.yml"),
        compileYml(),
      );
      await this.fs.writeFile(
        this.path.join(workflowsDir, "package.yml"),
        packageYml({ name: config.projectName }),
      );
    }
    await writeGmOptions(this, cache, projectDir, {
      toolchain: config.toolchain,
    });

    s.stop(`Project created at ${projectDir}`);

    if (flags.interactive) {
      p.outro(`Project created!`);
    }
  } catch (error) {
    s.stop("Failed");
    throw error;
  }
}
