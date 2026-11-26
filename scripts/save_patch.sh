#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
name="${1:?usage: save_patch.sh <patches/NNNN-name.patch> (diff of vscode/ working tree against the index)}"
{ sed -n '1,/^$/p' "$root/$name" 2>/dev/null; git -C "$root/vscode" diff --no-color --no-ext-diff; } > "$root/$name.new"
mv "$root/$name.new" "$root/$name"
