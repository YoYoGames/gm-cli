import { buildCommand } from "@stricli/core";

export const buildProjectCommand = buildCommand({
    loader: async () => import("./impl"),
    parameters: {
        positional: {
            kind: "tuple",
            parameters: [],
        },
    },
    docs: {
        brief: "Build the project",
    },
});
