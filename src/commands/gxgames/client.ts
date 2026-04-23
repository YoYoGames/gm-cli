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

import type { Context } from "~/context";
import { Api } from "./api";

// TODO: We need to decide how to deal with the tokens. Where to store them? Do we need refresh
// tokens? There is also api.setSecurityData(), so maybe this getter is excessive.
// Will look into that later.
export const getApiClient = (ctx: Context, accessToken: string) =>
  new Api({
    customFetch: ctx.fetch,
    baseUrl: "https://api.gx.games",
    securityWorker: () => ({
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  });
