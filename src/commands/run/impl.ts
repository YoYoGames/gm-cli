import type { Context } from "../../context";
import type { ProjectPath } from "../../project";
import {
  commonCompileSetup,
  type CommonCliBuildFlags,
} from "../../common-compile-setup";
import { stopProcesses } from "../../igor/kill-process";
import { constructIgorBuildArgs, spawnIgor } from "../../igor/spawn";

export default async function (
  this: Context,
  flags: CommonCliBuildFlags,
  project?: ProjectPath,
): Promise<void> {
  await commonCompileSetup(this, flags, project, {
    label: (target) => `Compiling & running for ${target}`,
    invoke: async (ctx, log, args) => {
      await spawnIgor(ctx, log, {
        igorPath: args.igorPath,
        args: constructIgorBuildArgs(args, "Run"),
        label: "Igor",
        onSignal: () => stopProcesses(ctx),
      });
      return { successMessage: "Game exited" };
    },
  });
}
