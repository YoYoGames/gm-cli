#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$SCRIPT_DIR/.."
DEMO_DIR="$REPO_DIR/demo-recording"
RECORDINGS_DIR="$REPO_DIR/recordings"

rm -rf "$DEMO_DIR"
mkdir -p "$DEMO_DIR" "$RECORDINGS_DIR"

cd "$DEMO_DIR"
cp "$SCRIPT_DIR/settings.tape" "$DEMO_DIR/settings.tape"

vhs "$SCRIPT_DIR/help.tape"
vhs "$SCRIPT_DIR/init.tape"
cd "$DEMO_DIR/space-game"
cp "$SCRIPT_DIR/settings.tape" "$DEMO_DIR/space-game/settings.tape"

vhs "$SCRIPT_DIR/run.tape"



mv "$DEMO_DIR"/*.gif "$RECORDINGS_DIR/"
mv "$DEMO_DIR"/space-game/*.gif "$RECORDINGS_DIR/"

rm -rf "$DEMO_DIR"
