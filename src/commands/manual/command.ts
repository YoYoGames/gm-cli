import { buildCommand, buildRouteMap } from "@stricli/core";

const MANUAL_LANGUAGES = [
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

export type ManualLanguage = (typeof MANUAL_LANGUAGES)[number];

const FLAGS = {
  language: {
    kind: "enum",
    values: MANUAL_LANGUAGES,
    brief: "Use the manual in the specified language",
    optional: true,
  },
} as const;

const PARAMETERS = {
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
  flags: FLAGS,
} as const;

export const manualAskCommand = buildCommand({
  loader: async () => import("./ask-impl"),
  parameters: PARAMETERS,
  docs: {
    brief: "Query the GameMaker manual",
  },
});

export const manualOpenCommand = buildCommand({
  loader: async () => import("./open-impl"),
  parameters: PARAMETERS,
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
