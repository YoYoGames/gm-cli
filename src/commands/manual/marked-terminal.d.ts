declare module "marked-terminal" {
  import type { MarkedExtension } from "marked";
  export function markedTerminal(options?: {
    showSectionPrefix?: boolean;
    link: (string) => string;
    href: (string) => string;
    [key: string]: unknown;
  }): MarkedExtension;
}
