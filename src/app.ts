import { buildApplication, buildRouteMap, text_en } from "@stricli/core";
import { name, version, description } from "../package.json";
import { initCommand } from "./commands/init/command";
import { buildProjectCommand } from "./commands/build/command";
import { runCommand } from "./commands/run/command";
import { KnownError } from "./error";

const routes = buildRouteMap({
  routes: {
    init: initCommand,
    build: buildProjectCommand,
    run: runCommand,
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
  localization: {
    loadText() {
      return {
        ...text_en,
        exceptionWhileRunningCommand(exc: unknown, _ansiColor: boolean) {
          if (exc instanceof KnownError) {
            return `Command failed, ${exc.message}`;
          }
          const detail =
            exc instanceof Error ? (exc.stack ?? exc.message) : String(exc);
          return `An unexpected error occurred. Please report it as a bug.\n\n${detail}`;
        },
      };
    },
  },
});
