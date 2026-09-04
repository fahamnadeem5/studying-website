<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Local runtime on this machine

- There is NO usable global Node.js: only an ancient v6 (from Brackets) sits on PATH, which cannot run Next.js. Prepend the portable Node before any node/npm/next command: `export PATH="$(pwd)/.tools/node:$PATH"`. Launching `next dev` without that PATH setup makes Turbopack's CSS workers resolve the old `node` and crash (pages 500). `start.bat` / `start.sh` already set PATH, pin the port, and fall back to a system Node.
- The environment injects a random `PORT` var — always pin the dev server explicitly (`-p 3000`). Freebuff restarts kill background servers/scrapes; rerun `start.bat 3000` afterwards and re-check `netstat` for stray listeners before re-scraping.

## Committed SQLite catalog (`data/alevelhub.db`)

- The catalog MUST stay in rollback (DELETE) journal mode: Vercel's serverless filesystem is read-only, and a WAL-mode DB cannot be opened even read-only there (SQLite must create `-shm` sidecars) → `SQLITE_CANTOPEN` / `errcode: 14` on every subject page. Nothing may run `PRAGMA journal_mode = WAL` against it — a local `next build`/`next start` that opens the DB writably silently flips the committed file's header, so check the file's mode after any build and never commit a re-WAL'd file.
- Local tests cannot catch this failure (a writable disk lets WAL DBs open read-only). Verify journal mode from the SQLite header byte at offset 18 (1=rollback, 2=WAL) on the on-disk file AND the staged blob (`git show :data/alevelhub.db`) before pushing.
- The DB is read at runtime via `process.cwd()` + `outputFileTracingIncludes` in `next.config.ts`; without that config the file never ships into Vercel's serverless functions.

## Deployment (Vercel)

- Vercel auto-redeploys from pushes to `origin/master`; fixing the live site means commit + push from here.
- `https://studying-website.vercel.app` answers anonymous probes; the `*-git-master-*.vercel.app` alias is SSO-protected (302 → `vercel.com/sso-api`) — always probe the canonical domain. Vercel keeps serving the previous deployment while a new one builds, so a fresh 500 can be a stale build.
- `/api/health` (committed, public) reports file presence + which DB-open stage throws at runtime — the fastest live-site diagnostic.
- `engines` in package.json must stay a narrow range (`"22.x"`): an open range like `>=22.5.0` makes Vercel auto-upgrade to the newest major (24.x, then 25). The site needs Node ≥ 22.5 for `node:sqlite`.
- `.freebuff/` holds thread-local logs/state: keep it gitignored and untracked, or the user's `git add`-style commits will keep sweeping log churn into the repo.

## Scraper knowledge (`scripts/scrape/`)

- CAIE paper filenames use 2-digit session years (`9709_w26_qp_73.pdf`) — a 4-digit year (`..._w2026_...`) looks plausible but is always a 404.
- papaCambridge answers EVERY `.pdf` path with a 302: real files redirect to the PDF, missing files redirect to its homepage (HTML soft-404). Probes must follow redirects and accept only `application/pdf` (`urlIsPdf` in `scripts/scrape/common.ts`); treating any sub-400 status as a hit stores homepage links.
- papaCambridge's HTML pages are JS-rendered/paywalled, so the scraper detects sessions via each session's grade-threshold file and probes known paper components against its file CDN.
