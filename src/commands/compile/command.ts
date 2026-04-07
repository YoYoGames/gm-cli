import { buildCommand } from "@stricli/core";

export const compileProjectCommand = buildCommand({
    loader: async () => import("./impl"),
    parameters: {
        positional: {
            kind: "tuple",
            parameters: [],
        },
    },
    docs: {
        brief: "Compile the project",
    },
});
