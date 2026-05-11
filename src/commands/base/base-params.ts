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

import { type TypedCommandFlagParameters } from "@stricli/core";
import type { Context } from "~/context";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type BaseFlags = {
  logType?: "plain" | "fancy";
  logLevel?: "errors" | "warnings" | "verbose";
};
export type BaseArgs = [];

export const BASE_PARAMS: TypedCommandFlagParameters<BaseFlags, Context> = {
  flags: {
    logType: {
      kind: "enum",
      values: ["plain", "fancy"],
      brief:
        "Output style: 'fancy' (interactive spinners/colors) or 'plain' (line-based, CI-friendly)",
      optional: true,
      default: "fancy",
    },
    logLevel: {
      kind: "enum",
      values: ["errors", "verbose"],
      brief:
        "Verbosity: 'errors' suppresses progress output, 'verbose' shows everything",
      optional: true,
      default: "verbose",
    },
  },
};
