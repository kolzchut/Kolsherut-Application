#!/bin/sh
set -e

SRC="/usr/share/nginx/html/configs/${environment}.json"
DST_DIR="/usr/share/nginx/html/configs"

mkdir -p "$DST_DIR"

if [ -f "$SRC" ]; then
  rm -f "$DST_DIR/environment.json"
  cp "$SRC" "$DST_DIR/environment.json"
  echo "Created environment.json from configs/${environment}.json"
else
  echo "Missing $SRC" >&2
  echo "Available files under $DST_DIR:" >&2
  ls -la "$DST_DIR" >&2 || true
  exit 1
fi
