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
import { z } from "zod";
import type { ManualLanguage } from "./command";
import type { Context } from "~/context";

const SearchResultSchema = z.object({
  content: z.string().optional(),
  url: z.string().optional(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

export async function searchManual(
  context: Context,
  query: string,
  language: ManualLanguage,
): Promise<SearchResult> {
  const response = await context.fetch("https://gx.mcp.opr.gg/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, language }),
  });

  return SearchResultSchema.parse(await response.json());
}
