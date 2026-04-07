import type { Context } from "../../context";
import { igorRun } from "../../igor";
import { commonCompileSetup, type BuildFlags } from "../../common-compile-setup";

export default async function (
  this: Context,
  flags: BuildFlags,
  project?: string,
): Promise<void> {
  await commonCompileSetup(this, flags, project, {
    label: (target) => `Compiling & running for ${target}`,
    invoke: igorRun,
  });
}
