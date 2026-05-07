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

export const CLIENT_ID = "gxe-gamemaker-cli";
export const REDIRECT_PORT = 53784;
// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
export const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/`;
export const AUTH_BASE = "https://oauth2.opera-api.com";
export const SCOPE = [
  "https://api.gx.games/gamedev:write",
  "https://api.gx.games/gamedev:read",
].join("+");
export const LINK_CACHE_SUBDIR = "gxgames-link";
export const AUTH_CACHE_SUBDIR = "gxgames-auth";

export const GG_API = "https://api.gx.games";
