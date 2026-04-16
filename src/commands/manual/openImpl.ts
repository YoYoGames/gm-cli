import type { Context } from "~/context";
import type { ManualReleaseChannel } from "./command";
import open from "open";
import { searchManual } from "./shared";

export default async function (
  this: Context,
  _flags: {
    channel?: ManualReleaseChannel;
    language?: string;
  },
  query: string,
): Promise<void> {
  const results = await searchManual(query);
  if (results[0]?.url) {
    await open(results[0].url);
  }
}
