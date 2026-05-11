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
import { searchManual } from "./search-manual";
import { KnownError } from "~/error";
import chalk from "chalk";
import type { BaseFlags } from "../base/base-params";

export default async function (
  this: Context,
  flags: {
    language?: ManualLanguage;
  } & BaseFlags,
  query: string,
): Promise<void> {
  const result = await searchManual(this, query, flags.language ?? "en");

  if (!result.url) {
    throw new KnownError("No results found");
  }

  await this.open(result.url);

  this.process.stdout.write(`Opening ${chalk.blue.underline(result.url)}\n`);
}
