# A-Level Hub

A website that brings together **all CAIE AS & A Level study resources** in one
place for the six big subjects:

| Code | Subject | | Code | Subject |
| ---- | ------- | --- | ---- | ------- |
| 9709 | Mathematics | | 9231 | Further Mathematics |
| 9702 | Physics | | 9700 | Biology |
| 9618 | Computer Science | | 9701 | Chemistry |

Each subject is split into **Yearly Past Papers**, **Topical Past Papers**,
**Notes** and **Books**, and the whole catalog is full-text searchable — with an
optional **live Reddit search** toggle that queries r/alevel on demand.

> **Links only.** This project never hosts or re-uploads papers/books. It
> indexes links to PapaCambridge's own archive, Physics & Maths Tutor, and
> files students share on Reddit (Drive/Mega/PDF).

## How it works

```
web scrapers ──► SQLite catalog (data/alevelhub.db) ──► Next.js site + search
   │                  │  (committed to the repo)            │
   └─ reddit API ─────┘                              live search toggle → Reddit API
```

Sources:
- **papaCambridge** — yearly papers 2009→now. papaCambridge's pages are
  JavaScript-heavy, so the scraper talks to their paper CDN directly
  (`pastpapers.papacambridge.com/directories/CAIE/…`), detecting which
  sessions exist via each session's grade-threshold file and probing the
  known paper components for that subject. Every link points back to their
  CDN.
- **notes.papaCambridge** — free revision notes, crawled from the static
  subject pages.
- **Physics & Maths Tutor** — their static CAIE paper collections (QP/MS
  PDFs) for maths, physics, CS, biology and chemistry.
- **Reddit** — batch search of r/alevel (+ r/6thForm, r/IGCSE) that indexes
  Drive/Mega/PDF links for all four sections. Requires free API keys (below);
  everything else works without them.

## Getting started

Requires **Node.js ≥ 22.5** (uses the built-in `node:sqlite` — no native
modules).

```bash
npm install

# 1. build the catalog (papaCambridge + notes + PMT; Reddit skipped until keys are set)
npm run scrape            # full default window (2009 → current year)

# 2. run the site
npm run dev               # http://localhost:3000
```

Scrape options:

```bash
npm run scrape -- --from 2019 --to 2025   # narrower papaCambridge year window
npm run scrape -- --sources pmt,notes     # only specific sources
npm run scrape -- --codes 9709,9702       # only specific subjects
npm run scrape -- --stats                 # show catalog stats and exit
```

The catalog is a single SQLite file, `data/alevelhub.db`, which is committed
so the deployed site needs no database service. Re-scraping updates it
in place (rows are deduped by source + URL; `last_verified` is refreshed).

### Reddit (optional)

```bash
cp .env.example .env.local   # then fill in REDDIT_* values
```

1. Sign in to Reddit → <https://www.reddit.com/prefs/apps> → *create
   another app…* → type **script**.
2. Copy the client ID + secret and your account username/password into
   `.env.local`.
3. Reddit's free tier allows 100 queries/min for non-commercial apps; the
   scraper is throttled well below that, and live-search results are cached
   for 24h.

With keys set, `npm run scrape` also indexes Reddit shares and the Search
page's *"Include live Reddit results"* toggle works.

## Project layout

```
scripts/scrape/          CLI scraper (index.ts orchestrates the sources)
  papacambridge.ts       CDN session detection + component probing
  notes_papacambridge.ts notes crawler
  pmt.ts                 PMT CAIE paper collections
  reddit.ts              Reddit batch indexer
src/lib/                 db (node:sqlite), subjects, reddit client, format helpers
src/app/                 Next.js pages + API routes (search, live-search, resources)
data/alevelhub.db        committed SQLite catalog (regenerate with npm run scrape)
```

## Keeping it fresh

New CAIE sessions drop around **Feb, June and October** each year. Re-run
`npm run scrape` after each release (takes a few minutes, adds ~200–400
files). A scheduled GitHub Action (`.github/workflows/refresh.yml`) can do
this monthly and open a PR with the updated DB — enable Actions on your repo
and it just works.

## Deploying

**Vercel** (recommended): import the repo — the committed DB makes the site
fully static-read on deploy. Set `REDDIT_*` env vars in the dashboard to
enable live search. The runtime opens the DB read-only, which is all the
catalog needs. Any other Node 22 host works the same way.

## Caveats & ethics

- Papers © Cambridge Assessment International Education — study use only.
- PapaCambridge/PMT pages and their CDN structures can change; scrapers fail
  gracefully and re-running them picks up fixes.
- Free Reddit API is for non-commercial use only.
- Some shared files (Drive/Mega) can disappear — links are verified on each
  scrape pass and stale rows get flagged rather than deleted.
