import { KnownError } from "~/error";
import crypto from "node:crypto";
import type { Context } from "~/context";

const CLIENT_ID = "gxe-gamemaker-cli";
const REDIRECT_PORT = 53784;
const REDIRECT_URI = "http://localhost:53784/";
const AUTH_BASE = "https://oauth2.opera-api.com/oauth2/v1";
const SCOPE = [
  "https://api.gx.games/gamedev:write",
  "https://api.gx.games/gamedev:read",
].join("+");

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
): Promise<string> {
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
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new KnownError("No access_token in response");
  }
  return json.access_token;
}

// TODO: Needs to be stateful. No need to authenticate if already authenticated
export async function authenticate(ctx: Context): Promise<string> {
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
  const token = await exchangeCodeForToken(code, state);
  log.success("Authenticated");

  return token;
}
