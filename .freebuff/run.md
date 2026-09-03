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

Dev server on the default port **3000**:

- Windows double-click: `start.bat` (uses `.tools\node` automatically).
- Git Bash / macOS / Linux: `./start.sh` (prefers `.tools/node`).
- Manual, any shell with Node ≥ 22.5 on PATH: `npm run dev`.

Then open http://localhost:3000 (Subjects → yearly papers → search all work
against the committed DB read-only).

For detached preview (PowerShell, different stdout/stderr files):

```powershell
powershell -NoProfile -Command "(Start-Process -FilePath '<abs>\npm.cmd' -ArgumentList 'run','dev' -RedirectStandardOutput '<log>' -RedirectStandardError '<log>.err' -WindowStyle Hidden -PassThru).Id"
```
