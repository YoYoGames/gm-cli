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
import { KnownError } from "~/error";
import type { Template } from "./types";

interface TemplateDto {
  id: string;
  type: "project_template";
  attributes: {
    position: number;
    gml_visual_download_url: string | null;
    gml_code_download_url: string | null;
    project_type: "game_strip" | "live_wallpaper" | "game";
    info_title: string;
    info_description: string;
    project_type_name: "GameStrip" | "Live Wallpaper" | "Game";
    thumbnail_image_url: string;
    info_image_url: string;
    created_at: string;
    updated_at: string;
  };
}

interface TemplateResponse {
  data: TemplateDto[];
}

export async function getTemplates(ctx: Context): Promise<Template[]> {
  const response = await ctx.fetch(
    "https://api.gamemaker.io/api/gamemaker/project-templates",
  );
  if (!response.ok) {
    throw new KnownError(`Failed to fetch templates: ${response.statusText}`);
  }
  const json: TemplateResponse = (await response.json()) as TemplateResponse; // FIXME: run zod here instead of asserting.
  const downloaded = json.data
    .map(({ id, attributes }) => {
      if (!attributes.gml_code_download_url) {
        return null;
      }
      return {
        kind: "download" as const,
        description: attributes.info_description,
        downloadUrl: attributes.gml_code_download_url,
        id,
        title: attributes.info_title,
        type: attributes.project_type_name,
      };
    })
    .filter((v) => !!v);

  return [
    ...downloaded,
    {
      kind: "blank" as const,
      id: "blank",
      title: "Blank Game",
      description: "An empty project",
      type: "Game" as const,
    },
  ];
}
