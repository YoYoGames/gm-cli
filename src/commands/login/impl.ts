import type { Context } from "../../context";
import { downloadIgor, fetchLicense } from "../../igor";
import { KnownError } from "../../error";

export const LICENSE_FILENAME = "licence.plist";

export default async function (
  this: Context,
  _flags: {},
  accessKey: string,
): Promise<void> {
  const cwd = this.process.cwd();
  const cacheDir = this.path.join(cwd, ".gmcache");
  const igorDir = this.path.join(cacheDir, "igor");

  const igorLog = this.makeLogger("Downloading Igor");
  let igorPath: string;
  try {
    igorPath = await downloadIgor(this, { destDir: igorDir, log: igorLog });
  } catch (e) {
    igorLog.error("Failed to download Igor");
    throw new KnownError(e);
  }
  igorLog.success("Igor downloaded");

  const licenseFile = this.path.join(cacheDir, LICENSE_FILENAME);
  const fetchLog = this.makeLogger("Fetching license");
  try {
    await fetchLicense(this, {
      igorPath,
      accessKey,
      outputFile: licenseFile,
      log: fetchLog,
    });
  } catch (e) {
    fetchLog.error("Failed to fetch license");
    throw new KnownError(e);
  }
  fetchLog.success(`License saved to "${licenseFile}"`);
}
