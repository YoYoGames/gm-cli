type TemplateBase = {
  id: string;
  title: string;
  description: string;
  type: "GameStrip" | "Live Wallpaper" | "Game";
};

export type Template =
  | (TemplateBase & { kind: "download"; downloadUrl: string })
  | (TemplateBase & { kind: "blank" });

export type ProjectConfig = {
  projectName: string;
  template: string;
  createClaude: boolean;
};
