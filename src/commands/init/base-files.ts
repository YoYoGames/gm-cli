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

export function compileYml(): string {
  return `name: Compile

# This job triggers when opening/updating a pull request or merging to the main branch
on:
  pull_request:
    types: [opened, synchronize, reopened]
  push:
    branches: [main]

concurrency:
  group: \${{ github.workflow }}-\${{ github.head_ref && github.ref || github.run_id }}
  cancel-in-progress: \${{ github.event_name == 'pull_request' }}

env:
  # You can pin a particular version by replacing latest. E.g., @gamemaker/gm-cli@1.0.2
  GM_COMMAND: "@gamemaker/gm-cli@latest"

jobs:
  compile:
    runs-on: ubuntu-latest

    steps:
      # Check out the git branch to build against
      - name: Checkout
        uses: actions/checkout@v6

      # Save a cache that can be reused between runs.
      # This will future runs faster, just like when you build the game locally
      - name: Cache
        uses: actions/cache@v5
        with:
          path: .gmcache
          key: \${{ runner.os }}-gmcache

      # ffmpeg is needed for linux: https://github.com/YoYoGames/GameMaker-Bugs/issues/4977
      - name: Install ffmpeg via apt
        if: \${{ runner.os == 'Linux' }}
        run: |
          sudo apt-get update
          sudo apt-get install -y ffmpeg

      # You can create an access token at https://gamemaker.io/en/account/access-keys
      # Then, in github, set a Repository Secret named GAMEMAKER_PAT with that value
      # in you repository Settings/Secrets and Varibles/Actions/New repository secret
      - run: npx "$GM_COMMAND" login "$GAMEMAKER_PAT"
        if: \${{ env.GAMEMAKER_PAT != '' }}

      # "Test compile" the game. Does not produce a bundle, but rather checks that it
      # possible to compile the game
      - run: npx "$GM_COMMAND" compile
        env:
          NO_COLOR: 1
`;
}

export function packageYml(options: { name: string }): string {
  return `name: Package
# This jobs start when the user trigger it manually from Github repository/Actions
on: [workflow_dispatch]

env:
  GAME_NAME: "${options.name}"
  # You can pin a particular version by replacing latest. E.g., @gamemaker/gm-cli@1.0.2
  GM_COMMAND: "@gamemaker/gm-cli@latest"

jobs:
  compile:
    strategy:
      matrix:
        # Select any runner and targets you want to build with
        # runner: The machine that builds your game. See https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job
        # target: The platform the game will run on.
        include:
          - runner: ubuntu-latest
            target: operagx
          # - runner: ubuntu-latest
          #   target: linux
          # - runner: ubuntu-latest
          #   target: windows
          # - runner: macos-latest
          #   target: mac
    runs-on: \${{ matrix.runner }}

    steps:
      # Check out the git branch to build against
      - name: Checkout
        uses: actions/checkout@v6

      # Save a cache that can be reused between runs.
      # This will future runs faster, just like when you build the game locally
      - name: Cache
        uses: actions/cache@v5
        with:
          path: .gmcache
          key: \${{ runner.os }}-gmcache-\${{ matrix.target }}

      # ffmpeg is needed for linux: https://github.com/YoYoGames/GameMaker-Bugs/issues/4977
      - name: Install ffmpeg via apt
        if: \${{ runner.os == 'Linux' }}
        run: |
          sudo apt-get update
          sudo apt-get install -y ffmpeg

      # You can create an access token at https://gamemaker.io/en/account/access-keys
      # Then, in github, set a Repository Secret named GAMEMAKER_PAT with that value
      # in you repository Settings/Secrets and Varibles/Actions/New repository secret
      - run: npx "$GM_COMMAND" login "$GAMEMAKER_PAT"
        if: \${{ env.GAMEMAKER_PAT != '' }}

      # Build and package the game. Create a file called package.zip.
      - run: npx "$GM_COMMAND" package --target \${{ matrix.target }} --output ./package.zip
        env:
          NO_COLOR: 1

      # Create the final name on the format \`name-target-commit.zip\` For example \`spacerocks-windows-5e0179f.zip\`
      - name: Create artifact name
        run: echo "ARTIFACT_NAME=\${GAME_NAME}-\${{ matrix.target }}-\${GITHUB_SHA::7}.zip" >> $GITHUB_ENV

      # Upload the game. You can then find it in you github repo under Actions/<The workflow run>/Artifacts
      - uses: actions/upload-artifact@v7
        with:
          name: \${{ env.ARTIFACT_NAME }}
          path: ./package.zip
`;
}
