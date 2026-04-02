import { z } from "zod";

// From Zeus/Igor/Modules.cs and Zeus/Igor/Targets.cs in GameMaker repo
export const TARGETS = [
  "amazonfire",
  "mac",
  "windows",
  "ios",
  "android",
  "html5",
  "linux",
  "ps4",
  "ps5",
  "xboxone",
  "xboxseriesxs",
  "winuwp",
  "tvos",
  "switch",
  "switch2",
  "wasm",
  "operagx",
  "reddit",
] as const;

export const TargetSchema = z
  .string()
  .transform((s) => s.toLowerCase())
  .pipe(z.enum(TARGETS));

export type Target = z.infer<typeof TargetSchema>;

export function defaultTarget(platform: NodeJS.Platform): Target {
  switch (platform) {
    case "win32":
      return "windows";
    case "darwin":
      return "mac";
    case "linux":
      return "linux";
    default:
      throw new Error(`No default target for platform: ${platform}`);
  }
}
