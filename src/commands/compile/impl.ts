import type { Context } from "~/context";
import type { ProjectPath } from "~/project";
import {
  commonCompileSetup,
  type CommonCliBuildFlags,
} from "~/common-compile-setup";
import { constructIgorBuildArgs, spawnIgor } from "~/igor/spawn";
import { stopProcesses } from "~/igor/kill-process";

export default async function (
  this: Context,
  flags: CommonCliBuildFlags,
  project?: ProjectPath,
): Promise<void> {
  await commonCompileSetup(this, flags, project, {
    label: (target) => `Compiling for ${target}`,
    invoke: async (ctx, log, options) => {
      await spawnIgor(ctx, log, {
        igorPath: options.igorPath,
        args: constructIgorBuildArgs(ctx, options, "Compile"),
        label: "Igor",
        onSignal: () => {
          stopProcesses(ctx);
        },
      });
      return { successMessage: "Compilation finished" };
    },
  });
}
