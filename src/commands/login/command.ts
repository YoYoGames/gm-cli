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

export const loginCommand = buildCommand({
  loader: async () => import("./impl"),
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Access key",
          placeholder: "access-key",
          parse: String,
        },
      ],
    },
    flags: {
      print: {
        kind: "boolean",
        brief: "Print the license to stdout instead of saving to a file",
        optional: true,
      },
      cacheDir: {
        kind: "parsed",
        parse: String,
        brief: "Cache directory",
        optional: true,
      },
    },
  },
  docs: {
    brief: "Sign-in using an access key",
    fullDescription:
      "Sign-in using an access key.\n\nYou can issue an access key at: https://gamemaker.io/en/account/access-keys",
  },
});
