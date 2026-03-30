import type { Context } from "../../context";

interface BuildCommandFlags {
  // ...
}

export default async function (
  this: Context,
  flags: BuildCommandFlags,
): Promise<void> {
  console.warn("TODO: Implement this");
}
