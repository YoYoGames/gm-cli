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

import { KnownError } from "~/error";
import crypto from "node:crypto";
import type { Context } from "~/context";
import { readAuth, writeAuth } from "./link";
import { Cache } from "~/cache";
import {
  AUTH_BASE,
  CLIENT_ID,
  REDIRECT_PORT,
  REDIRECT_URI,
  SCOPE,
} from "./config";

function waitForAuthCode(ctx: Context): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = ctx.http.createServer((req, res) => {
      const url = new URL(req.url ?? "/", REDIRECT_URI);
      const code = url.searchParams.get("code");
      res.writeHead(200, { "Content-Type": "text/html" });
      // TODO: Seems like we can't close this automatically. We could make this page a bit nices though!
      // We should also handle errors here
      res.end(
        [
          "<html>",
          "<body>",
          "<p>Login successful. You can close this tab.</p>",
          "</body>",
          "</html>",
        ].join("\n"),
      );
      server.close();
      if (code) {
        resolve(code);
      } else {
        reject(new KnownError("No auth code in redirect"));
      }
    });
    server.on("error", reject);
    server.listen(REDIRECT_PORT);
  });
}

async function exchangeCodeForToken(
  code: string,
  state: string,
): Promise<{ accessToken: string; expiresAt: number }> {
  const res = await fetch(new URL("/oauth2/v1/token/", AUTH_BASE), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        state,
      }).toString() + `&scope=${SCOPE}`,
  });
  if (!res.ok) {
    throw new KnownError(`Token exchange failed: ${res.statusText}`);
  }
  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!json.access_token) {
    throw new KnownError("No access_token in response");
  }
  const expiresIn = json.expires_in ?? 3600;
  return {
    accessToken: json.access_token,
    // 60s buffer so we re-auth before the token actually expires
    expiresAt: Date.now() + (expiresIn - 60) * 1000,
  };
}

export interface AuthManager {
  getAccessToken(): Promise<string>;
}

export function createAuthManager(ctx: Context): AuthManager {
  return { getAccessToken: () => authenticate(ctx) };
}

export async function authenticate(ctx: Context): Promise<string> {
  const cache = await Cache.initLazy(ctx, { type: "infer" });
  const cached = await readAuth(ctx, cache);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.accessToken;
  }

  const state = crypto.randomBytes(16).toString("hex");

  const authUrl = new URL("/oauth2/v1/authorize/", AUTH_BASE);
  authUrl.search =
    new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      state,
    }).toString() + `&scope=${SCOPE}`;

  const codePromise = waitForAuthCode(ctx);
  await ctx.open(authUrl.toString());

  const log = ctx.makeTaskLogger("Authenticating");
  log.message("Waiting for browser login...");
  const code = await codePromise;
  const { accessToken, expiresAt } = await exchangeCodeForToken(code, state);
  await writeAuth(ctx, { accessToken, expiresAt }, cache);
  log.success("Authenticated");

  return accessToken;
}
