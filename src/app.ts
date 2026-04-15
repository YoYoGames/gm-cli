import { buildApplication, buildRouteMap, text_en } from "@stricli/core";
import { name, version, description } from "../package.json";
import { initCommand } from "./commands/init/command";
import { compileProjectCommand } from "./commands/compile/command";
import { runCommand } from "./commands/run/command";
import { resourcetoolCommand } from "./commands/resourcetool/command";
import { loginCommand } from "./commands/login/command";
import { packageCommand } from "./commands/package/command";
import { KnownError } from "./error";

const routes = buildRouteMap({
  routes: {
    init: initCommand,
    compile: compileProjectCommand,
    run: runCommand,
    resourcetool: resourcetoolCommand,
    login: loginCommand,
    package: packageCommand,
  },
  docs: {
    brief: description,
  },
});

export const app = buildApplication(routes, {
  name,
  versionInfo: {
    currentVersion: version,
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
          return `An unexpected error occurred. Please report it as a bug.\n\n${detail}`;
        },
      };
    },
  },
});
