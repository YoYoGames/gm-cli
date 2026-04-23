/**
 * Copyright 2026, Opera Norway AS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at:
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { taskLog } from "@clack/prompts";

export interface Log {
  message(msg: string): void;
  error(message: string): void;
  success(message: string): void;
}

export type TaskLogger = (title: string) => Log;

const noop = () => {
  // intentionally empty
};

export const noopLog: Log = {
  message: noop,
  error: noop,
  success: noop,
};

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
