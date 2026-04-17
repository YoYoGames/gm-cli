import type { CommandContext } from "@stricli/core";
import child_process from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { KnownError } from "./error";
import type { TaskLogger } from "./log";
import { fancyTaskLogger, plainTaskLogger } from "./log";
import open from "open";
import http from "node:http";

export interface Context extends CommandContext {
  readonly process: NodeJS.Process;
  readonly child_process: typeof child_process;
  readonly os: typeof os;
  readonly fs: typeof fs;
  readonly path: typeof path;
  readonly fetch: typeof globalThis.fetch;
  readonly open: typeof open;
  readonly http: typeof http;
  readonly makeTaskLogger: TaskLogger;
}

export async function exists(ctx: Context, path: string): Promise<boolean> {
  try {
    await ctx.fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export function getPrefabsDirOrThrow(ctx: Context): string {
  const envPrefabs = ctx.process.env["GAMEMAKER_PREFABS"];
  if (envPrefabs !== undefined) {
    return envPrefabs;
  }

  throw new KnownError(
    "A prefabs directory is required. Specify a path with `--prefabs=...` or the GAMEMAKER_PREFABS env variable.\n\nTODO: This should not be required for the user to provide, gm-cli should use the default location.\nBut for now, just do export GAMEMAKER_PREFABS=/Users/Shared/GameMakerStudio2/Prefabs",
  );
}

export function buildContext(process: NodeJS.Process): Context {
  const noColor = "NO_COLOR" in process.env;
  return {
    process,
    child_process,
    open,
    http,
    os,
    fs,
    path,
    fetch,
    makeTaskLogger: noColor ? plainTaskLogger() : fancyTaskLogger(),
  };
}
