import { Cache } from "~/cache";
import type { Context } from "~/context";
import { downloadIgor, fetchLicense } from "~/igor";
import { KnownError } from "~/error";
import { findProjectFile } from "~/project";

export const LICENSE_FILENAME = "licence.plist";

export default async function (
  this: Context,
  flags: { print?: boolean; cacheDir?: string },
  accessKey: string,
): Promise<void> {
  const cwd = this.process.cwd();
  const projectPath = await findProjectFile(this, cwd).catch(() => undefined);

  const cache = await Cache.getOrInit(
    this,
    flags.cacheDir
      ? { type: "absolute", path: flags.cacheDir }
      : projectPath
        ? { type: "infer", projectDir: this.path.dirname(projectPath) }
        : { type: "temporary" },
  );

  if (cache.cacheType === "temporary" && !flags.print) {
    throw new KnownError(
      "No project found in the current directory. Run this command from a project directory, or use --print to output the license to stdout.",
    );
  }

  const igorLog = this.makeTaskLogger("Downloading Igor");
  let igorPath: string;
  try {
    igorPath = await downloadIgor(this, igorLog, cache);
  } catch (e) {
    igorLog.error("Failed to download Igor");
    throw new KnownError(e);
  }
  igorLog.success("Igor downloaded");

  const licenseFile = flags.print
    ? this.path.join(
        this.os.tmpdir(),
        `gm-licence-${String(this.process.pid)}.plist`,
      )
    : this.path.join(cache.dirPath, LICENSE_FILENAME);
  const fetchLog = this.makeTaskLogger("Fetching license");
  try {
    await fetchLicense(this, igorLog, {
      igorPath,
      accessKey,
      outputFile: licenseFile,
    });
  } catch (e) {
    fetchLog.error("Failed to fetch license");
    throw new KnownError(e);
  }
  if (flags.print) {
    const content = await this.fs.readFile(licenseFile, "utf-8");
    this.process.stdout.write("\n" + content + "\n");
    await this.fs.rm(licenseFile);
  } else {
    fetchLog.success(`License saved to "${licenseFile}"`);
  }
}
