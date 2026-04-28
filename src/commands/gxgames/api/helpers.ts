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
import { ApiErrorCodes } from "./error-codes";
import type { HttpResponse } from "./http-client";

export const unwrapResponse = async <
  TData extends { errors: null; data?: unknown },
  TError extends { errors: { code: keyof typeof ApiErrorCodes }[] },
>(
  response: HttpResponse<TData, TError> | Promise<HttpResponse<TData, TError>>,
) => {
  response = await response;
  if (response.error) {
    return {
      success: false,
      errors: response.error.errors.map(({ code }) => ({
        code,
        description: ApiErrorCodes[code],
      })) as {
        code: TError["errors"][number]["code"];
        description: string;
      }[],
    } as const;
  }

  return {
    success: true,
    data: response.data.data as TData["data"],
  } as const;
};
