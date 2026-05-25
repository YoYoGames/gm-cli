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

export const gitignore = `
# Windows

# Windows thumbnail cache files
Thumbs.db
Thumbs.db:encryptable
ehthumbs.db
ehthumbs_vista.db

# Dump file
*.stackdump

# Folder config file
[Dd]esktop.ini

# Recycle Bin used on file shares
$RECYCLE.BIN/

# Windows Installer files
*.cab
*.msi
*.msix
*.msm
*.msp

# Windows shortcuts
*.lnk

# Mac

## General
.DS_Store
.AppleDouble
.LSOverride

## Icon must end with two \r
Icon

## Thumbnails
._*

## Files that might appear in the root of a volume
.DocumentRevisions-V100
.fseventsd
.Spotlight-V100
.TemporaryItems
.Trashes
.VolumeIcon.icns
.com.apple.timemachine.donotpresent

## Directories potentially created on remote AFP share
.AppleDB
.AppleDesktop
Network Trash Folder
Temporary Items
.apdisk

# GameMaker temporary files
*.resource_order
*.old

# GMRT build directory
Build
`;
export const gitattributes = `
# Ignore .yy files for language statistics
*.yy linguist-generated=true

# force LF for metadata files for merge simplicity
*.gml text eol=lf
*.yy text eol=lf
*.yyp text eol=lf
*.json text eol=lf
`;

import compileYmlTemplate from "./compile.yml";
import packageYmlTemplate from "./package.yml";

export function compileYml(): string {
  return compileYmlTemplate;
}

export function packageYml(options: { name: string }): string {
  return packageYmlTemplate.replace("{{GAME_NAME}}", options.name);
}
