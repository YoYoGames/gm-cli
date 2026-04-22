import type { Context } from "~/context";
import type { ManualLanguage } from "./command";
import open from "open";
import { searchManual } from "./searchManual";

export default async function (
  this: Context,
  flags: {
    language?: ManualLanguage;
  },
  query: string,
): Promise<void> {
  const result = await searchManual(query, flags.language ?? "en");

  if (!result.url) {
    throw new Error("No results found");
  }

  await open(result.url);
}
