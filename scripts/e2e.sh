#!/usr/bin/env bash
set -euo pipefail

GM_COMMAND="$(pwd)/dist/cli.js"
GM_CACHE_DIR="$(pwd)/.gmcache"

run_test() {
  local template="$1"
  local target="$2"

  echo "=== E2E: template='$template' target='$target' ==="

  rm -rf test-game
  node "$GM_COMMAND" init --template "$template" --name="test-game" --no-interactive --cache-dir "$GM_CACHE_DIR"
  cd test-game

  echo "--- compile (cold) ---"
  node "$GM_COMMAND" compile --target "$target" --cache-dir "$GM_CACHE_DIR"

  echo "--- compile (warm) ---"
  node "$GM_COMMAND" compile --target "$target" --cache-dir "$GM_CACHE_DIR"

  echo "--- resourcetool ---"
  node "$GM_COMMAND" resourcetool eval "resource list" --cache-dir "$GM_CACHE_DIR"

  cd ..
  echo "=== PASSED: '$template' / $target ==="
}

export NO_COLOR=1

run_test "Blank Game" operagx
run_test "Brick Breaker" operagx

rm -rf test-game
