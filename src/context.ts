import type { CommandContext } from "@stricli/core";
import { taskLog } from "@clack/prompts";
import child_process from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { Log } from "./log";

export interface Context extends CommandContext {
  readonly process: NodeJS.Process;
  readonly child_process: typeof child_process;
  readonly os: typeof os;
  readonly fs: typeof fs;
  readonly path: typeof path;
  readonly makeLogger: (title: string) => Log;
}

export function buildContext(process: NodeJS.Process): Context {
  return {
    process,
    child_process,
    os,
    fs,
    path,
    // FIXME: we should support disabling this when NO_COLOR or similar is set. Better for LLM use too
    makeLogger: (title: string) => taskLog({ title, retainLog: true }),
  };
}
