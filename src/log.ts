import { taskLog } from "@clack/prompts";

export interface Log {
  message(msg: string): void;
  error(message: string): void;
  success(message: string): void;
}

export type TaskLogger = (title: string) => Log;

export function fancyTaskLogger(): TaskLogger {
  return (title) => taskLog({ title, retainLog: true });
}

export function plainTaskLogger(): TaskLogger {
  return (title) => {
    let headerPrinted = false;
    function ensureHeader() {
      if (!headerPrinted) {
        headerPrinted = true;
        console.log(`=== ${title} ===`);
      }
    }
    return {
      message(msg: string) {
        ensureHeader();
        console.log(msg);
      },
      error(msg: string) {
        ensureHeader();
        console.error(msg);
      },
      success(msg: string) {
        ensureHeader();
        console.log(msg);
      },
    };
  };
}
