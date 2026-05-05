/* eslint-disable */
// @ts-nocheck
import { generateApi } from "swagger-typescript-api";
import path from "node:path";
import { writeFile } from "node:fs/promises";

const schema = await (
  await fetch("https://test.api.gmx.dev/v3/api-docs/Game%20Dev")
).json();

const errorCodes: Record<string, string> = {};

for (const path of Object.keys(schema.paths)) {
  for (const [_method, definition] of Object.entries<any>(schema.paths[path])) {
    for (const [status, response] of Object.entries<any>(
      definition.responses,
    )) {
      if (!Number(status)) {
        continue;
      }

      const responseSchemaRef = response.content["application/json"].schema[
        "$ref"
      ]
        .split("/")
        .slice(1)
        .reduce((o: any, key: any) => o[key], schema).properties.data?.["$ref"];

      if (!responseSchemaRef) {
        definition.responses[status] = {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["data", "errors"],
                properties: {
                  errors: { enum: [null] },
                },
              },
            },
          },
        };
        continue;
      }
      definition.responses[status] = {
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["data", "errors"],
              properties: {
                data: {
                  $ref: responseSchemaRef,
                },
                errors: { enum: [null] },
              },
            },
          },
        },
      };
    }

    /* Parse error codes */
    const errorDescrption: string | undefined = (definition as any)?.responses
      .Error?.description;
    if (errorDescrption) {
      for (const line of errorDescrption.split("\n").slice(2)) {
        const [code, description] = line
          .split("|")
          .slice(2, 4)
          .map((s) => s.trim().replaceAll("`", ""));
        if (!code) {
          continue;
        }
        errorCodes[code] = description;

        definition.responses["default"] ??= {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["data", "errors"],
                properties: {
                  data: { enum: [null] },
                  errors: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["code"],
                      properties: {
                        code: {
                          type: "string",
                          enum: [],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        };
        definition.responses["default"].content[
          "application/json"
        ].schema.properties.errors.items.properties.code.enum.push(code);
      }
    } else {
      definition.responses["default"] ??= {
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["data", "errors"],
              properties: {
                data: { enum: [null] },
                errors: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["code"],
                    properties: {
                      code: {
                        type: "string",
                        enum: ["DO_NOT_USE_NOT_SUPPORTED"],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };
    }
    delete definition.responses.Error;
  }
}

{
  let deletedSomething;
  do {
    deletedSomething = false;
    for (const key of Object.keys(schema.components.schemas)) {
      if (JSON.stringify(schema).includes(`#/components/schemas/${key}`)) {
        continue;
      }
      deletedSomething = true;
      delete schema.components.schemas[key];
    }
  } while (deletedSomething);
}

writeFile(
  path.resolve("./src/commands/gxgames/api/generated", "error-codes.ts"),
  `/* eslint-disable */\nexport const ApiErrorCodes = {
${Object.entries(errorCodes)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([key, value]) => `  ${key}: "${value}",\n`)
  .join("")}}
`,
);

await generateApi({
  spec: schema,
  output: path.resolve("./src/commands/gxgames/api/generated"),
  fileName: "api.ts",
  httpClientType: "fetch",
  disableThrowOnError: true,
  extractEnums: true,
  extractResponseBody: false,
  extractResponseError: false,
  generateUnionEnums: true,
  modular: true,
  sortRoutes: true,
  sortTypes: true,
  templates: path.resolve("./src/commands/gxgames/api/templates"),
});
