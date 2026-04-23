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

import { buildCommand } from "@stricli/core";
import type { Context } from "~/context";

export const gxgamesCommand = buildCommand({
  loader: async () => {
    const { default: run } = await import("./impl");
    return {
      default: async function (
        this: Context,
        flags: Record<never, never>,
        file: string,
      ) {
        return run(this, flags, file);
      },
    };
  },
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "File",
          placeholder: "file",
          parse: String,
        },
      ],
    },
  },
  docs: {
    brief: "Upload to GX.Games",
  },
});
