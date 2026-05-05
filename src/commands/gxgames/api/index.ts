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
import { Gamedev } from "./generated/Gamedev";
import { GG_API } from "../config";

export { LinkStorage, type GxGamesLink } from "./storage";

export function getApiClient(
  ctx: Context,
  auth: {
    getAccessToken(): Promise<string>;
  },
) {
  return new Gamedev({
    customFetch: ctx.fetch,
    baseUrl: GG_API,
    securityWorker: async () => ({
      headers: { Authorization: `Bearer ${await auth.getAccessToken()}` },
    }),
  });
}
