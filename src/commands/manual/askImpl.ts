import type { Context } from "~/context";
import type { ManualLanguage } from "./command";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import { searchManual } from "./searchManual";
import chalk from "chalk";

const MD_LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;
const formatLink = chalk.blue.underline;

function supportsTerminalLinks(): boolean {
  // TODO: Add terminal detection here!
  // I.e. check env var WT_PROCESS
  return false;
}

// Use Operating System Commands to create a terminal hyperlink
function toTerminalLink(input: string): string {
  const match = /^(.+?)\s+\(([^)]+)\)$/.exec(input);

  if (!match) {
    return input;
  }

  const [, title, url] = match;

  if (!title || !url) {
    return input;
  }

  return formatLink(`\x1b]8;;${toManualUrl(url)}\x1b\\${title}\x1b]8;;\x1b\\`);
}

// Converts "text (url)" -> italic "text"
function stripLink(link: string): string {
  const text = link.split(" (").at(0);
  return text ? `\x1b[3m${text}\x1b[0m` : link;
}

export function toManualUrl(articlePath: string) {
  return `https://manual.gamemaker.io/monthly/en/${articlePath}`;
}

export default async function (
  this: Context,
  flags: {
    language?: ManualLanguage;
  },
  query: string,
): Promise<void> {
  const result = await searchManual(query, flags.language ?? "en");

  if (!result.content || !result.url) {
    throw new Error("No results found");
  }

  // If NO_COLOR is set, simply display raw Markdown
  if ("NO_COLOR" in this.process.env) {
    console.log(result.content);
    return;
  }

  // Display the Markdown contents using ANSI
  console.log(await marked(result.content));

  // Collect links to display after article
  if (!supportsTerminalLinks()) {
    const links = result.content.matchAll(MD_LINK_PATTERN);

    for (const link of links) {
      const text = link[1];
      const article = link[2];

      if (!text || !article) {
        continue;
      }

      const formattedLink = formatLink(toManualUrl(article));
      console.log(`${text}: ${formattedLink}`);
    }
  }

  const formattedSource = formatLink(result.url);
  console.log(`Article source: ${formattedSource}`);
}

marked.use(
  markedTerminal({
    showSectionPrefix: false,
    reflowText: true,
    link: supportsTerminalLinks() ? toTerminalLink : stripLink,
    href: supportsTerminalLinks() ? (href: string) => href : () => "",
  }),
);
