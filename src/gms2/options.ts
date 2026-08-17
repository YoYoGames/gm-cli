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

export interface Gms2ToolchainOptions {
  operagx: {
    packageType?: "zip" | "wallpaper" | "gamestrip";
    emscriptenSdk?: string;
  };
  windows: {
    packageType?: "zip" | "nsis";
    visualStudioSdk?: string;
  };
  mac: {
    packageType?: "zip" | "dmg";
  };
  linux: {
    packageType?: "zip" | "appimage";
  };
  android: {
    packageType?: "apk" | "aab";
    sdkPath?: string;
    ndkPath?: string;
    jdkPath?: string;
    keystoreFile?: string;
    keystorePassword?: string;
    keystoreAlias?: string;
    keystoreAliasPassword?: string;
  };
}

export function defaultGms2ToolchainOptions(): Gms2ToolchainOptions {
  return {
    operagx: {
      packageType: "zip",
    },
    windows: {
      packageType: "zip",
    },
    mac: {
      packageType: "zip",
    },
    linux: {
      packageType: "zip",
    },
    android: {
      packageType: "apk",
    },
  };
}
