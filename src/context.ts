import type { CommandContext } from "@stricli/core";
import child_process from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { TaskLogger } from "./log";
import { fancyTaskLogger, plainTaskLogger } from "./log";

export interface Context extends CommandContext {
  readonly process: NodeJS.Process;
  readonly child_process: typeof child_process;
  readonly os: typeof os;
  readonly fs: typeof fs;
  readonly path: typeof path;
  readonly fetch: typeof globalThis.fetch;
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

export function buildContext(process: NodeJS.Process): Context {
  const noColor = "NO_COLOR" in process.env;
  return {
    process,
    child_process,
    os,
    fs,
    path,
    fetch,
    makeTaskLogger: noColor ? plainTaskLogger() : fancyTaskLogger(),
  };
}
