import { z } from "zod";

export const SearchResult = z.object({
  content: z.string(),
  documentName: z.string(),
  headerText: z.string(),
  url: z.string(),
});

export const SearchResults = z.array(SearchResult);

export type SearchResult = z.infer<typeof SearchResult>;

const McpContentItem = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({
    type: z.literal("image"),
    data: z.string(),
    mimeType: z.string(),
  }),
]);

const McpResponse = z.union([
  z.object({
    jsonrpc: z.literal("2.0"),
    id: z.number(),
    result: z.object({
      content: z.array(McpContentItem),
      isError: z.boolean().optional(),
    }),
  }),
  z.object({
    jsonrpc: z.literal("2.0"),
    id: z.number(),
    error: z.object({ code: z.number(), message: z.string() }),
  }),
]);

export async function searchManual(query: string): Promise<SearchResult[]> {
  const response = await fetch("http://localhost:3000/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "search",
        arguments: { query },
      },
      id: 1,
    }),
  });

  const text = await response.text();
  const dataLine = text.split("\n").find((line) => line.startsWith("data:"));

  if (!dataLine) {
    throw new Error("Unable to fetch manual");
  }

  const dataContents = dataLine.slice("data:".length);
  const parsed = z
    .string()
    .transform((s): unknown => JSON.parse(s))
    .pipe(McpResponse)
    .parse(dataContents);

  if ("error" in parsed) {
    throw new Error("Unable to fetch manual");
  }

  for (const item of parsed.result.content) {
    if (item.type === "text") {
      return SearchResults.parse(JSON.parse(item.text));
    }
  }

  return [];
}
