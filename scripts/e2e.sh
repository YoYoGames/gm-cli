#!/usr/bin/env bash
set -euo pipefail

GM_COMMAND="$(pwd)/dist/cli.js"
GM_CACHE_DIR="$(pwd)/.gmcache"

run_test() {
  local template="$1"
  local target="$2"
  local toolchain="${3:-}"

  echo "=== E2E: template='$template' target='$target' toolchain='${toolchain:-default}' ==="

  rm -rf test-game
  node "$GM_COMMAND" init --template "$template" --name="test-game" --no-interactive --cache-dir "$GM_CACHE_DIR"
  cd test-game

  local compile_args=(--target "$target" --cache-dir "$GM_CACHE_DIR")
  if [ -n "$toolchain" ]; then
    compile_args+=(--toolchain "$toolchain")
  fi

  echo "--- compile (cold) ---"
  node "$GM_COMMAND" compile "${compile_args[@]}"

  echo "--- compile (warm) ---"
  node "$GM_COMMAND" compile "${compile_args[@]}"

  echo "--- resourcetool ---"
  node "$GM_COMMAND" resourcetool eval "resource list" --cache-dir "$GM_CACHE_DIR"

  cd ..
  echo "=== PASSED: '$template' / $target / toolchain='${toolchain:-default}' ==="
}

export NO_COLOR=1

run_test "Blank Game" operagx

#run_test "Blank Game" operagx gmrt

# let's save some CI resources and only run multiple games on Windows!

# The platformer game is a good tests since it makes use of prefabs
#run_test "Platformer" operagx

rm -rf test-game
