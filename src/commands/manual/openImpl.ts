import type { Context } from "~/context";
import type { ManualLanguage, ManualReleaseChannel } from "./command";
import open from "open";
import { searchManual } from "./searchManual";

export default async function (
  this: Context,
  _flags: {
    channel?: ManualReleaseChannel;
    language?: ManualLanguage;
  },
  query: string,
): Promise<void> {
  const result = await searchManual(query);

  if (!result.url) {
    throw new Error("No results found");
  }

  await open(result.url);
}
