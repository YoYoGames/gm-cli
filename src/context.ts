import type { CommandContext } from "@stricli/core";
import child_process from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export interface Context extends CommandContext {
  readonly process: NodeJS.Process;
  readonly child_process: typeof child_process;
  readonly os: typeof os;
  readonly fs: typeof fs;
  readonly path: typeof path;
}

export function buildContext(process: NodeJS.Process): Context {
  return {
    process,
    child_process,
    os,
    fs,
    path,
  };
}
