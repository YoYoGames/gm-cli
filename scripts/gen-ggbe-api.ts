import { generateApi } from "swagger-typescript-api";
import path from "node:path";

await generateApi({
  url: "https://test.api.gmx.dev/v3/api-docs/Game%20Dev",
  output: path.resolve("./src/commands/gxgames"),
  fileName: "api.ts",
  httpClientType: "fetch",
  unwrapResponseData: true,
});
