import { buildCommand, buildRouteMap } from "@stricli/core";

const ManualLanguages = [
  "en",
  "ru",
  "br",
  "it",
  "fr",
  "pl",
  "es",
  "ko",
  "de",
  "ja",
  "zh",
] as const;

export type ManualLanguage = (typeof ManualLanguages)[number];

const flags = {
  language: {
    kind: "enum",
    values: ManualLanguages,
    brief: "Use the manual in the specified language",
    optional: true,
  },
  channel: {
    kind: "enum",
    brief: "Use a specific release channel of the manual",
    optional: true,
  },
} as const;

const parameters = {
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
  flags,
} as const;

export const manualAskCommand = buildCommand({
  loader: async () => import("./askImpl"),
  parameters,
  docs: {
    brief: "Query the GameMaker manual",
  },
});

export const manualOpenCommand = buildCommand({
  loader: async () => import("./openImpl"),
  parameters,
  docs: {
    brief: "Open the GameMaker manual website based on a query",
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
