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

import { buildApplication, buildRouteMap, text_en } from "@stricli/core";
import { version, description } from "../package.json";
import { initCommand } from "./commands/init/command";
import { compileProjectCommand } from "./commands/compile/command";
import { runCommand } from "./commands/run/command";
import { resourcetoolCommand } from "./commands/resourcetool/command";
import { loginCommand } from "./commands/login/command";
import { packageCommand } from "./commands/package/command";
import { gxgamesCommand } from "./commands/gxgames/command";
import { KnownError } from "./error";
import { getLatestVersion } from "./get-latest-version";
import { manualCommand } from "./commands/manual/command";
import { cacheCommand } from "./commands/cache/command";

const routes = buildRouteMap({
  routes: {
    init: initCommand,
    run: runCommand,
    compile: compileProjectCommand,
    package: packageCommand,
    manual: manualCommand,
    resourcetool: resourcetoolCommand,
    login: loginCommand,
    gxgames: gxgamesCommand,
    cache: cacheCommand,
  },
  docs: {
    hideRoute: {
      gxgames: !process.env["GAMEMAKER_CLI_UNSTABLE_FEATURES"],
    },
    brief: description,
  },
});

export const app = buildApplication(routes, {
  name: "gm-cli",
  versionInfo: {
    currentVersion: version,
    getLatestVersion,
    upgradeCommand: "npm install -g @gamemaker/gm-cli",
  },
  documentation: {
    caseStyle: "convert-camel-to-kebab",
    onlyRequiredInUsageLine: true,
  },
  scanner: {
    caseStyle: "allow-kebab-for-camel",
  },
  localization: {
    loadText() {
      return {
        ...text_en,
        exceptionWhileRunningCommand(exc: unknown, _ansiColor: boolean) {
          if (exc instanceof KnownError) {
            return `Command failed:\n${exc.message}`;
          }
          const detail =
            exc instanceof Error
              ? (exc.stack ?? exc.message)
              : JSON.stringify(exc, null, 2);
          return `An unexpected error occurred. Please report it as a bug on https://github.com/YoYoGames/gm-cli/issues\nGM-CLI v${version} ${process.platform}/${process.arch}\n\n${detail}`;
        },
      };
    },
  },
});
