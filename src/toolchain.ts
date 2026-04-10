import { z } from "zod";

const toolchainTypeSchema = z
  .string()
  .transform((s) => s.toUpperCase())
  .pipe(z.enum(["GMS2", "GMRT"], { error: "Expected GMS2 or GMRT" }));

// FIXME: we should probably allow channels like "beta", "lts" too
const gms2VersionSchema = z
  .string()
  .regex(
    /^\d+(\.\d+){0,3}$/,
    "Expected version in format X.Y.Z.Z (fewer digits allowed too)",
  )
  .transform((s) => {
    const parts = s.split(".").map(Number);
    return [parts[0], parts[1], parts[2], parts[3]] as [
      number,
      number | undefined,
      number | undefined,
      number | undefined,
    ];
  });

const gmrtVersionSchema = z
  .string()
  .regex(
    /^\d+(\.\d+)?$/,
    "Expected version in format X.Y (allowed to only have one digit too)",
  )
  .transform((s) => {
    const parts = s.split(".").map(Number);
    return [parts[0], parts[1]] as [number, number | undefined];
  });

export function parseToolchainVersion(s: string): ToolchainVersion {
  const [rawType, rawVersion] = s.split("@", 2);

  const typeResult = toolchainTypeSchema.safeParse(rawType);
  if (!typeResult.success) {
    throw new Error(typeResult.error.issues[0]?.message);
  }
  const type = typeResult.data;

  if (rawVersion === undefined) {
    return { type };
  }

  if (type === "GMS2") {
    const versionResult = gms2VersionSchema.safeParse(rawVersion);
    if (!versionResult.success) {
      throw new Error(versionResult.error.issues[0]?.message);
    }
    return { type, version: versionResult.data };
  }

  const versionResult = gmrtVersionSchema.safeParse(rawVersion);
  if (!versionResult.success) {
    throw new Error(versionResult.error.issues[0]?.message);
  }
  return { type, version: versionResult.data };
}

export type Gms2Version = z.infer<typeof gms2VersionSchema>;

export type GmrtVersion = z.infer<typeof gmrtVersionSchema>;

export type ToolchainType = z.infer<typeof toolchainTypeSchema>;

export type ToolchainVersion =
  | {
      type: "GMS2";
      version?: Gms2Version;
    }
  | {
      type: "GMRT";
      version?: GmrtVersion;
    };
