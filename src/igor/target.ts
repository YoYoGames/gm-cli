import type { Context } from "../context";
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

export function targetForPlatform(platform: NodeJS.Platform): Target {
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

export function baseModuleForPlatform(
  ctx: Context,
): `base-module-${string}-${string}` {
  const moduleArch = ctx.process.arch === "arm64" ? "arm" : "x86";
  switch (ctx.process.platform) {
    case "linux":
      return `base-module-linux-${moduleArch}`;
    case "darwin":
      return `base-module-osx-${moduleArch}`;
    case "win32":
      return `base-module-windows-x64`;
    default:
      throw new Error(`No base module for platform: ${ctx.process.platform}`);
  }
}

/**
 * Modules are more or less just the targets + the base module for your host platform
 */
const ModuleSchema = z.union([
  TargetSchema,
  z.literal("base"),
  z
    .string()
    .regex(/^base-module-.+-.+$/)
    .transform((s) => s as `base-module-${string}-${string}`),
]);

export type Module = z.infer<typeof ModuleSchema>;

export async function getInstalledRuntimeModules(
  ctx: Context,
  runtimeLocation: string,
): Promise<Module[]> {
  const receiptPath = ctx.path.join(runtimeLocation, "receipt.json");
  const content = await ctx.fs.readFile(receiptPath, "utf-8");
  const receipt = JSON.parse(content);

  return Object.keys(receipt)
    .map((key) => ModuleSchema.safeParse(key))
    .filter((result) => result.success)
    .map((result) => result.data);
}
