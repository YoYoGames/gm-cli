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
import chalk from "chalk";
import crypto from "node:crypto";
import type { Context } from "~/context";
import type { TaskLogger } from "~/log";
import { AuthStorage, type GxGamesAuth } from "./storage";
import { AUTH_BASE, CLIENT_ID, REDIRECT_PORT, SCOPE } from "../config";
import successHtml from "./success.html";
import errorHtml from "./error.html";
import type http from "node:http";
import type open from "tiny-open";

interface AuthConfig {
  fetch: typeof fetch;
  http: typeof http;
  open: typeof open;
  makeTaskLogger: TaskLogger;
  storage: AuthStorage;
  baseUrl?: string;
  redirectPort?: number;
}

class Auth {
  private readonly baseUrl: string;
  private readonly redirectPort: number;
  private readonly redirectUri: string;

  constructor(private readonly config: AuthConfig) {
    this.baseUrl = config.baseUrl ?? AUTH_BASE;
    this.redirectPort = config.redirectPort ?? REDIRECT_PORT;
    this.redirectUri = `http://localhost:${String(this.redirectPort)}/`;
  }

  private async exchangeToken(
    params: Record<string, string>,
  ): Promise<GxGamesAuth> {
    const res = await this.config.fetch(
      new URL("/oauth2/v1/token/", this.baseUrl),
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body:
          new URLSearchParams({ ...params, client_id: CLIENT_ID }).toString() +
          `&scope=${SCOPE}`,
      },
    );

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new KnownError(
        `Token exchange failed: ${body?.error ?? res.statusText}`,
      );
    }

    const json = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      refresh_token?: string;
    };

    if (!json.access_token) {
      throw new KnownError("No access_token in response");
    }

    return {
      accessToken: json.access_token,
      // 60s buffer so we re-auth before the token actually expires
      expiresAt: Date.now() + ((json.expires_in ?? 3600) - 60) * 1000,
      refreshToken: json.refresh_token,
    };
  }

  private async browserAuth(): Promise<GxGamesAuth> {
    const state = crypto.randomBytes(16).toString("hex");

    const authUrl = new URL("/oauth2/v1/authorize/", this.baseUrl);
    authUrl.search =
      new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: this.redirectUri,
        state,
      }).toString() + `&scope=${SCOPE}`;

    const codePromise = new Promise<{
      code: string;
      sendPage: (html: string) => void;
    }>((resolve, reject) => {
      const server = this.config.http.createServer((req, res) => {
        const url = new URL(req.url ?? "/", this.redirectUri);
        const code = url.searchParams.get("code");
        const returnedState = url.searchParams.get("state");
        const errorDescription =
          url.searchParams.get("error_description") ??
          url.searchParams.get("error");

        res.writeHead(200, { "Content-Type": "text/html" });
        server.close();

        if (returnedState !== state) {
          const msg = "State mismatch";
          res.end(errorHtml.replace("{{ERROR_MESSAGE}}", msg));
          reject(new KnownError(msg));
        } else if (code) {
          resolve({ code, sendPage: (html) => res.end(html) });
        } else {
          const msg = errorDescription ?? "No auth code in redirect";
          res.end(errorHtml.replace("{{ERROR_MESSAGE}}", msg));
          reject(new KnownError(msg));
        }
      });
      server.on("error", reject);
      server.listen(this.redirectPort);
    });

    const authUrlStr = authUrl.toString();
    await this.config.open(authUrlStr);

    const log = this.config.makeTaskLogger("Authenticating");
    log.message(`Opening ${chalk.blue.underline(authUrlStr)}`);

    const { code, sendPage } = await codePromise;

    try {
      const auth = await this.exchangeToken({
        grant_type: "authorization_code",
        code,
        redirect_uri: this.redirectUri,
      });
      sendPage(successHtml);
      log.success("Authenticated");
      return auth;
    } catch (err) {
      sendPage(
        errorHtml.replace(
          "{{ERROR_MESSAGE}}",
          err instanceof Error ? err.message : String(err),
        ),
      );
      throw err;
    }
  }

  async getAccessToken(): Promise<string> {
    const cached = await this.config.storage.read();

    if (cached && cached.expiresAt > Date.now()) {
      return cached.accessToken;
    }

    if (cached?.refreshToken) {
      try {
        const auth = await this.exchangeToken({
          grant_type: "refresh_token",
          refresh_token: cached.refreshToken,
        });
        await this.config.storage.write(auth);
        return auth.accessToken;
      } catch {
        // fall through to browser auth
      }
    }

    const auth = await this.browserAuth();
    await this.config.storage.write(auth);
    return auth.accessToken;
  }
}

export function createAuthManager(ctx: Context, projectDir?: string) {
  return new Auth({
    fetch: ctx.fetch,
    http: ctx.http,
    open: ctx.open,
    makeTaskLogger: ctx.makeTaskLogger,
    storage: new AuthStorage(ctx, projectDir),
  });
}
