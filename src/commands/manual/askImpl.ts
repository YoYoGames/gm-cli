import type { Context } from "~/context";
import type { ManualLanguage, ManualReleaseChannel } from "./command";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import { searchManual } from "./searchManual";

const MD_LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;

export function createFullManualUrl(
  articlePath: string,
  channel: ManualReleaseChannel,
) {
  return `https://manual.gamemaker.io/${channel}/en/${articlePath}`;
}

export default async function (
  this: Context,
  _flags: {
    channel?: ManualReleaseChannel;
    language?: ManualLanguage;
  },
  query: string,
): Promise<void> {
  const result = await searchManual(query);

  if (!result.content || !result.url) {
    throw new Error("No results found");
  }

  // Strip addresses from links, add italics
  const stripped = result.content.replaceAll(MD_LINK_PATTERN, "*$1*");

  // Collect links to display after article
  const links = result.content.matchAll(MD_LINK_PATTERN);

  console.log(await marked(stripped));

  marked.use(markedTerminal({ showSectionPrefix: false }));

  for (const link of links) {
    const text = link[1];
    const article = link[2];

    if (!text || !article) {
      continue;
    }

    console.log(`${text}: ${createFullManualUrl(article, "monthly")}`);
  }

  console.log(`Article source: ${result.url}`);
}

marked.use(markedTerminal({ showSectionPrefix: false, reflowText: true }));
