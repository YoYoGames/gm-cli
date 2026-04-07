import type { Template } from "./types";
import { Cache } from "../../cache";
import type { Context } from "../../context";
import { KnownError } from "../../error";
import { downloadProjectTool } from "../../projectTool";

export async function scaffoldProject(
  ctx: Context,
  template: Template & { kind: "download" },
  project: { name: string; dir: string },
) {
  const response = await fetch(template.downloadUrl);
  if (!response.ok) {
    throw new KnownError(`Failed to download template: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();

  const archivePath = project.dir + ".zip";
  await ctx.fs.writeFile(archivePath, Buffer.from(buffer));

  const cache = await Cache.getOrInit(
    ctx,
    ctx.path.join(project.dir, ".gmcache"),
  );
  const projectToolPath = await downloadProjectTool(ctx, {
    cache,
    log: { message() {}, error() {}, success() {} },
    verbose: false,
  });

  const destinationYyp = ctx.path.join(project.dir, `${project.name}.yyp`);
  ctx.child_process.execFileSync(projectToolPath, [
    "PROJECT",
    "SAVE",
    `SOURCE=${archivePath}`,
    `DESTINATION=${destinationYyp}`,
  ]);

  await ctx.fs.unlink(archivePath);
}
