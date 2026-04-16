import type { Context } from "~/context";
import type { ManualReleaseChannel } from "./command";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import { searchManual } from "./shared";

marked.use(markedTerminal({ showSectionPrefix: false, reflowText: true }));

export default async function (
  this: Context,
  _flags: {
    channel?: ManualReleaseChannel;
    language?: string;
  },
  query: string,
): Promise<void> {
  const results = await searchManual(query);
  console.log(
    (await marked(
      results[0]?.content
        .replaceAll("\n* ", "\n\n")
        .replaceAll("](", "](https://manual.gamemaker.io/monthly/en/") ?? "",
    )) +
      "\n\n" +
      `Source: ${results[0]?.url ?? ""}`,
  );
}
