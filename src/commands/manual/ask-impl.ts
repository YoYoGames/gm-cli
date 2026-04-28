/**
 * Copyright 2026, Opera Norway AS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at:
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import type { Context } from "~/context";
import type { ManualLanguage } from "./command";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import { searchManual } from "./search-manual";
import chalk from "chalk";
import { KnownError } from "~/error";

const formatLink = chalk.blue.underline;

function supportsTerminalLinks(): boolean {
  // TODO: Add terminal detection here!
  // I.e. check env var WT_PROCESS
  return false;
}

// Use Operating System Commands to create a terminal hyperlink
function toTerminalLink(input: string, language: ManualLanguage): string {
  const match = /^(.+?)\s+\(([^)]+)\)$/.exec(input);

  if (!match) {
    return input;
  }

  const [, title, url] = match;

  if (!title || !url) {
    return input;
  }

  return formatLink(
    `\x1b]8;;${toManualUrl(url, language)}\x1b\\${title}\x1b]8;;\x1b\\`,
  );
}

// Converts "text (url)" -> italic "text"
function stripLink(link: string): string {
  const text = link.split(" (").at(0);
  return text ? `\x1b[3m${text}\x1b[0m` : link;
}

export function toManualUrl(articlePath: string, language: ManualLanguage) {
  return `https://manual.gamemaker.io/monthly/${language}/${articlePath}`;
}

export default async function (
  this: Context,
  flags: {
    language?: ManualLanguage;
  },
  query: string,
): Promise<void> {
  const language = flags.language ?? "en";
  const result = await searchManual(this, query, language);

  if (!result.content || !result.url) {
    throw new KnownError("No results found");
  }

  // If NO_COLOR is set, simply display raw Markdown
  if ("NO_COLOR" in this.process.env) {
    this.process.stdout.write(result.content);
    return;
  }

  marked.use(
    markedTerminal({
      showSectionPrefix: false,
      reflowText: true,
      link: supportsTerminalLinks()
        ? (link: string) => toTerminalLink(link, language)
        : stripLink,
      href: supportsTerminalLinks() ? (href: string) => href : () => "",
    }),
  );

  // Display the Markdown contents using ANSI
  this.process.stdout.write(await marked(result.content));

  const formattedSource = formatLink(result.url);
  this.process.stdout.write(`\nArticle source: ${formattedSource}\n`);
}
