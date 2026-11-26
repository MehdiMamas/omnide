#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
brand="$root/src/omnide/brand"
res="$root/vscode/resources"
cp "$brand/omnide.icns" "$res/darwin/code.icns"
cp "$brand/omnide.ico" "$res/win32/code.ico"
cp "$brand/omnide.png" "$res/linux/code.png"
cp "$brand/code_150x150.png" "$brand/code_70x70.png" "$res/win32/"
mkdir -p "$root/vscode/src/vs/workbench/browser/media/fonts"
cp "$root"/src/omnide/fonts/*.woff2 "$root/vscode/src/vs/workbench/browser/media/fonts/"
mkdir -p "$root/vscode/extensions/theme-omnide/themes"
cp "$root/extensions/theme-omnide/package.json" "$root/vscode/extensions/theme-omnide/"
cp "$root"/src/omnide/theme/*.json "$root/vscode/extensions/theme-omnide/themes/"
