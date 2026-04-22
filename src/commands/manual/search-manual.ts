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
