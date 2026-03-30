import type { Template } from "./types";

export function validateProjectName(name: string): string | undefined {
  if (!name) return "Project name is required";
  if (!/^[a-z0-9-_]+$/i.test(name))
    return "Use only letters, numbers, dashes, and underscores";
}

export function findTemplate(
  templates: Template[],
  query: string,
): Template | undefined {
  return templates.find(
    (t) =>
      t.id === query || t.title.toLowerCase().includes(query.toLowerCase()),
  );
}
