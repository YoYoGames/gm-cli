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

import type { Template } from "./types";

export function validateProjectName(name: string): string | undefined {
  if (!name) {
    return "Project name is required";
  }
  if (!/^[a-z0-9-_]+$/i.test(name)) {
    return "Use only letters, numbers, dashes, and underscores";
  }
}

export function findTemplate(
  templates: Template[],
  query: string,
): Template | undefined {
  return (
    templates.find((t) => t.id === query) ??
    templates.find((t) => t.title.toLowerCase().includes(query.toLowerCase()))
  );
}
