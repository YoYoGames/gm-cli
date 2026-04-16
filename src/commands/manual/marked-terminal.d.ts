declare module "marked-terminal" {
  import type { MarkedExtension } from "marked";
  export function markedTerminal(options?: {
    showSectionPrefix?: boolean;
    [key: string]: unknown;
  }): MarkedExtension;
}
