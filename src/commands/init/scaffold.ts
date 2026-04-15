import type { Template } from "./types";
import type { Cache } from "~/cache";
import type { Context } from "~/context";
import { KnownError } from "~/error";
import { downloadProjectTool } from "~/projectTool";
import { noopLog } from "~/log";

export async function scaffoldProject(
  ctx: Context,
  template: Template & { kind: "download" },
  project: { name: string; dir: string },
  cache: Cache,
) {
  const response = await ctx.fetch(template.downloadUrl);
  if (!response.ok) {
    throw new KnownError(`Failed to download template: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();

  const archivePath = project.dir + ".zip";
  await ctx.fs.writeFile(archivePath, Buffer.from(buffer));

  const projectToolPath = await downloadProjectTool(ctx, {
    cache,
    log: noopLog,
    verbose: false,
  });

  const destinationYyp = ctx.path.join(project.dir, `${project.name}.yyp`);
  ctx.child_process.execFileSync(
    projectToolPath,
    [
      "PROJECT",
      "SAVE",
      `SOURCE=${archivePath}`,
      `DESTINATION=${destinationYyp}`,
    ],
    {
      env:
        ctx.process.platform === "darwin"
          ? { ...ctx.process.env, COMPlus_ZapDisable: "1" }
          : undefined,
    },
  );

  await ctx.fs.unlink(archivePath);
}
