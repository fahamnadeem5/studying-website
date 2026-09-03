# A-Level Hub — dev/preview run doc

Next.js 16 app (App Router) with a committed SQLite catalog
(`data/alevelhub.db`) read via Node's built-in `node:sqlite`.

## Reproducing the artifacts a fresh checkout needs

1. **Node runtime**: this machine has NO system Node (only a v6 from Brackets).
   A portable Node 22 lives at `.tools/node/` (gitignored). Fresh checkouts on
   this machine must restore it, e.g. download
   `https://nodejs.org/dist/v22.23.2/node-v22.23.2-win-x64.zip` and unzip to
   `.tools/node`. Machines with Node ≥ 22.5 installed can skip this.
2. **Dependencies**: `npm install` (run with the portable node on PATH:
   `export PATH="$PWD/.tools/node:$PATH"` in Git Bash, or call
   `.tools\node\npm.cmd` directly on Windows).
3. **Environment**: no `.env.local` required. Optional Reddit keys
   (`REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USERNAME`,
   `REDDIT_PASSWORD`) enable the reddit scraper + live search only — see
   `.env.example`. Copy from the main checkout if present.
4. **Catalog**: `data/alevelhub.db` is committed. Regenerate/extend with
   `npm run scrape` (optional; not needed to serve).

## Running the server

Dev server on the default port **3000**.

- Windows double-click: `start.bat` (uses `.tools\node` automatically).
- Git Bash / macOS / Linux: `./start.sh` (prefers `.tools/node`).
- Manual, any shell with Node ≥ 22.5 on PATH: `npm run dev`.

Then open http://localhost:3000 (Subjects → yearly papers → search all work
against the committed DB read-only).

### Gotcha: Turbopack CSS workers need Node on PATH

Next dev spawns CSS/PostCSS worker processes that resolve `node` from the
**PATH** (not `process.execPath`). On THIS machine the only global node is an
ancient v6 (Brackets), so launching `next dev` or `npm.cmd` with the portable
node only via an absolute path crashes workers with a Turbopack panic
(`node process exited … exit code 9`, CSS errors) and pages 500.

**The launchers fix this** — `start.bat` / `start.sh` prepend `.tools/node` to
PATH before calling npm. Any detached launch must do the same, e.g.:

```powershell
# start.bat does the PATH setup internally — launch it directly by path:
powershell -NoProfile -Command "(Start-Process -FilePath '<proj>\start.bat' -ArgumentList '3000' -WorkingDirectory '<proj>' -RedirectStandardOutput '<log>' -RedirectStandardError '<log>.err' -WindowStyle Hidden -PassThru).Id"
# confirm the LISTENING pid on the port afterwards (netstat) for preview registration
```

Note: this environment may also inject a random `PORT` env var, so pass the
port explicitly (`start.bat 3000` / `npm run dev -- -p 3000`).
