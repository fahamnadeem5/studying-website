#!/usr/bin/env bash
# ── A-Level Hub launcher (macOS / Linux / Git Bash) ─────────────────────
# Run `./start.sh` (or `bash start.sh`) to start the site at
# http://localhost:3000. Optional first argument: port, e.g. `./start.sh 4000`.
set -e
cd "$(dirname "$0")"

PORT="${1:-3000}"

# Prefer the bundled portable Node when present (Windows portable layout),
# otherwise fall back to a system Node.js.
if [ -x ".tools/node/node" ] || [ -x ".tools/node/node.exe" ]; then
    export PATH="$PWD/.tools/node:$PATH"
elif command -v npm >/dev/null 2>&1; then
    : # system Node.js is fine
else
    echo "error: no Node.js found. Install Node 22+ from https://nodejs.org" >&2
    exit 1
fi

echo "Starting A-Level Hub on http://localhost:${PORT} ..."
echo "(press Ctrl+C to stop)"
exec npm run dev -- -p "$PORT"
