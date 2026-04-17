import { buildCommand } from "@stricli/core";
import type { Context } from "~/context";

export const gxgamesCommand = buildCommand({
  loader: async () => {
    const { default: run } = await import("./impl");
    return {
      default: async function (
        this: Context,
        flags: Record<never, never>,
        file: string,
      ) {
        return run(this, flags, file);
      },
    };
  },
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "File",
          placeholder: "file",
          parse: String,
        },
      ],
    },
  },
  docs: {
    brief: "Upload to GX.Games",
  },
});
