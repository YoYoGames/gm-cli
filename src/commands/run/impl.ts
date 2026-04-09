import type { Context } from "../../context";
import type { ProjectPath } from "../../project";
import { igorRun } from "../../igor";
import {
  commonCompileSetup,
  type BuildFlags,
} from "../../common-compile-setup";

export default async function (
  this: Context,
  flags: BuildFlags,
  project?: ProjectPath,
): Promise<void> {
  await commonCompileSetup(this, flags, project, {
    label: (target) => `Compiling & running for ${target}`,
    invoke: igorRun,
  });
}
