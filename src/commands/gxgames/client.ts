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
