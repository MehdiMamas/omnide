#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
target="${1:-}"
if [ -z "$target" ]; then
  case "$(uname -s)-$(uname -m)" in
    Darwin-arm64) target=darwin-arm64 ;;
    Darwin-x86_64) target=darwin-x64 ;;
    Linux-x86_64) target=linux-x64 ;;
    MINGW*|MSYS*) target=win32-x64 ;;
    *) echo "pass a target such as win32-x64" >&2; exit 1 ;;
  esac
fi
"$root/scripts/prepare_vscode.sh"
"$root/scripts/patches.sh"
"$root/scripts/assets.sh"
cd "$root/vscode"
pnpm install --frozen-lockfile
pnpm run gulp "vscode-$target-min"
