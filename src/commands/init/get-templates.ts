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

export async function getTemplates(): Promise<Template[]> {
  const response = await fetch(
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
