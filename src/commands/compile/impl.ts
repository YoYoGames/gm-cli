import type { Context } from "../../context";

interface CompileCommandFlags {
  // ...
}

export default async function (
  this: Context,
  flags: CompileCommandFlags,
): Promise<void> {
  console.warn("TODO: Implement this");
}
