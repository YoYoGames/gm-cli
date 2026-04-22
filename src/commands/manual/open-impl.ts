import type { Context } from "~/context";
import type { ManualLanguage } from "./command";
import open from "open";
import { searchManual } from "./search-manual";
import { KnownError } from "~/error";

export default async function (
  this: Context,
  flags: {
    language?: ManualLanguage;
  },
  query: string,
): Promise<void> {
  // FIXME: Add support for other languages
  if (flags.language && flags.language !== "en") {
    throw new KnownError("Support for ${language} is coming soon");
  }

  const result = await searchManual(this, query, flags.language ?? "en");

  if (!result.url) {
    throw new KnownError("No results found");
  }

  await open(result.url);
}
