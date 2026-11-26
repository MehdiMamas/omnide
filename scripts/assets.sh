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
# product.overrides.json wins over upstream; its removeKeys list is deleted from the result.
# defaultChatAgent keeps its shape (upstream reads it unguarded at startup) but loses every URL.
jq -s '.[1] as $o | (.[0] * ($o | del(.removeKeys))) | delpaths([($o.removeKeys // [])[] | [.]]) | .defaultChatAgent |= walk(if type == "string" and test("^https?://") then "" else . end)' \
  "$root/vscode/product.json" "$root/product.overrides.json" > "$root/vscode/product.json.new"
mv "$root/vscode/product.json.new" "$root/vscode/product.json"
