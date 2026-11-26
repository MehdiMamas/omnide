#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
for patch in "$root"/patches/*.patch; do
  echo "applying $(basename "$patch")"
  git -C "$root/vscode" apply --whitespace=nowarn "$patch"
done
