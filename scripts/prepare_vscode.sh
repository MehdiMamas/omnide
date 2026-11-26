#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"
repo="$(node -p "require('./upstream.json').repo")"
tag="$(node -p "require('./upstream.json').tag")"
dest="$root/vscode"
if [ ! -d "$dest/.git" ]; then
  git init -q "$dest"
  git -C "$dest" remote add origin "https://github.com/$repo.git"
  git -C "$dest" config core.autocrlf false
fi
git -C "$dest" fetch --depth 1 origin "refs/tags/$tag:refs/tags/$tag"
git -C "$dest" checkout -q -f "$tag"
git -C "$dest" clean -fdq
