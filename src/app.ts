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

const routes = buildRouteMap({
  routes: {
    init: initCommand,
    compile: compileProjectCommand,
    run: runCommand,
    resourcetool: resourcetoolCommand,
    login: loginCommand,
    package: packageCommand,
    gxgames: gxgamesCommand,
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
            exc instanceof Error ? (exc.stack ?? exc.message) : String(exc);
          return `An unexpected error occurred. Please report it as a bug.\nGM-CLI v${version} ${process.platform}/${process.arch}\n\n${detail}`;
        },
      };
    },
  },
});
