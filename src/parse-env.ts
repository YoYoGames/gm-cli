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

import chalk from "chalk";
import { z } from "zod";

export interface ParsedEnv {
  GAMEMAKER_CLI_CACHE_DIR: string | undefined;
  GAMEMAKER_CLI_LICENSE: string | undefined;
  GAMEMAKER_CLI_UNSTABLE_FEATURES: boolean | undefined;
  NO_COLOR: boolean | undefined;
  CI: boolean | undefined;
  LOCALAPPDATA: string | undefined;
  XDG_CACHE_HOME: string | undefined;
}

const booleanEnvVar = z.preprocess(
  (val) => (typeof val === "string" ? val.toLowerCase() : val),
  z
    .enum(["true", "1", "false", "0", ""])
    .transform((val) => val === "true" || val === "1"),
);

let parsedEnv: ParsedEnv | undefined = undefined;

export function getParsedEnv(): ParsedEnv {
  // We store a global copy of the parsed env since we need to use this function
  // both in get-latest-version and when constructing the context object and we want to avoid
  // printing warnings for the parse erorrs multiple times.
  if (parsedEnv !== undefined) {
    return parsedEnv;
  }
  const env = parseEnv(process.env);
  parsedEnv = env;
  return env;
}

function parseEnv(rawEnv: NodeJS.ProcessEnv): ParsedEnv {
  function parse<T>(key: keyof ParsedEnv, schema: z.ZodType<T>): T | undefined {
    if (rawEnv[key] === undefined) {
      return undefined;
    }

    const result = schema.safeParse(rawEnv[key]);
    if (!result.success) {
      const msg = `Ignoring environment variable ${key}. ${result.error.issues[0]?.message ?? "invalid value"}`;
      console.error(rawEnv["NO_COLOR"] !== undefined ? msg : chalk.yellow(msg));
      return undefined;
    }
    return result.data;
  }

  const env = {
    GAMEMAKER_CLI_CACHE_DIR: parse("GAMEMAKER_CLI_CACHE_DIR", z.string()),
    GAMEMAKER_CLI_LICENSE: parse("GAMEMAKER_CLI_LICENSE", z.string()),
    GAMEMAKER_CLI_UNSTABLE_FEATURES: parse(
      "GAMEMAKER_CLI_UNSTABLE_FEATURES",
      booleanEnvVar,
    ),
    // Note: this does not match the behaviour stated on no-color.org:
    // "when present and not an empty string (regardless of its value), prevents the addition of ANSI color."
    NO_COLOR: parse("NO_COLOR", booleanEnvVar),
    CI: parse("CI", booleanEnvVar),
    LOCALAPPDATA: parse("LOCALAPPDATA", z.string()),
    XDG_CACHE_HOME: parse("XDG_CACHE_HOME", z.string()),
  };

  const knownKeys = new Set<string>(Object.keys(env));
  for (const key of Object.keys(rawEnv)) {
    if (key.startsWith("GAMEMAKER_CLI_") && !knownKeys.has(key)) {
      const msg = `Unknown environment variable ${key} will be ignored.`;
      console.error(rawEnv["NO_COLOR"] !== undefined ? msg : chalk.yellow(msg));
    }
  }
  return env;
}
