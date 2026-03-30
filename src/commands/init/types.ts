export type Template = {
  id: string;
  title: string;
  description: string;
  type: "GameStrip" | "Live Wallpaper" | "Game";
  downloadUrl: string;
};

export type ProjectConfig = {
  projectName: string;
  template: string;
  createClaude: boolean;
};
