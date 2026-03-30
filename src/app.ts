import { buildApplication, buildRouteMap } from "@stricli/core";
import { name, version, description } from "../package.json";
import { initCommand } from "./commands/init/command";
import { buildProjectCommand } from "./commands/build/command";
import { runCommand } from "./commands/run/command";

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
});
