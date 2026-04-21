import { z } from "zod";

const SearchResultSchema = z.object({
  content: z.string().optional(),
  url: z.string().optional(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

export async function searchManual(query: string): Promise<SearchResult> {
  const response = await fetch("http://localhost:3000/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query }),
  });

  return SearchResultSchema.parse(await response.json());
}
