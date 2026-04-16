import { buildCommand, buildRouteMap } from "@stricli/core";

export type ManualCommand = "ask" | "open";
export type ManualReleaseChannel = "lts" | "beta" | "monthly";

export const manualAskCommand = buildCommand({
  loader: async () => import("./askImpl"),
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Query",
          placeholder: "query",
          parse: String,
        },
      ],
    },
    flags: {
      language: {
        kind: "parsed", // FIXME: should be an enum of supported languages
        parse: String,
        brief: "Use the manual in the specified language",
        optional: true,
      },
      channel: {
        kind: "enum",
        values: ["lts", "beta", "monthly"],
        brief: "Use a specific release channel for the manual",
        optional: true,
      },
    },
  },
  docs: {
    brief: "Query the GameMaker manual",
  },
});

export const manualOpenCommand = buildCommand({
  loader: async () => import("./openImpl"),
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Query",
          placeholder: "query",
          parse: String,
        },
      ],
    },
    flags: {
      language: {
        kind: "parsed", // FIXME: should be an enum of supported langagues
        parse: String,
        brief: "Use the manual in the specified language",
        optional: true,
      },
      channel: {
        kind: "enum",
        values: ["lts", "beta", "monthly"],
        brief: "Use a specific release channel for the manual",
        optional: true,
      },
    },
  },
  docs: {
    brief: "Query the GameMaker manual",
  },
});

export const manualCommand = buildRouteMap({
  routes: {
    ask: manualAskCommand,
    open: manualOpenCommand,
  },
  docs: {
    brief: "Use the GameMaker manual",
  },
});
