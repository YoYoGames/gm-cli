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

interface TemplateBase {
  id: string;
  title: string;
  description: string;
  type: "GameStrip" | "Live Wallpaper" | "Game";
}

export type Template =
  | (TemplateBase & { kind: "download"; downloadUrl: string })
  | (TemplateBase & { kind: "blank" });

import type { ToolchainVersion } from "~/toolchain";

export interface ProjectConfig {
  projectName: string;
  template: string;
  useAi: boolean;
  useActions: boolean;
  toolchain: ToolchainVersion;
}
