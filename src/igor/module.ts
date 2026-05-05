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

import { z } from "zod";
import { TargetSchema } from "~/target";

/**
 * Modules are more or less just the targets + the base module for your host platform
 */
export const ModuleSchema = z.union([
  TargetSchema,
  z.literal("base"),
  z
    .string()
    .regex(/^base-module-.+-.+$/)
    .transform((s) => s as `base-module-${string}-${string}`),
]);

export type Module = z.infer<typeof ModuleSchema>;
