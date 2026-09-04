#!/usr/bin/env tsx
/**
 * A-Level Hub catalog builder.
 *
 * Usage:
 *   npm run scrape                      # yearly (2009→this year) + notes + pmt + reddit
 *   npm run scrape -- --from 2020       # narrow the papaCambridge year window
 *   npm run scrape -- --sources pmt,notes
 *   npm run scrape -- --no-reddit
 *   npm run scrape -- --stats           # print catalog stats and exit
 */

import { readFileSync } from "node:fs";
import { closeDb, countResources, db, dbPath, stats } from "../../src/lib/db";
import { scrapePapaCambridge } from "./papacambridge";
import { scrapeNotesPapaCambridge } from "./notes_papacambridge";
import { scrapePmt } from "./pmt";
import { scrapeReddit } from "./reddit";
import { SUBJECTS } from "../../src/lib/subjects";

const NOW = new Date();
const DEFAULT_FROM = 2009;
const DEFAULT_TO = NOW.getFullYear();

interface Args {
  from: number;
  to: number;
  codes: string[];
  sources: string[];
  redditSections: string[];
  noReddit: boolean;
  noStaleMarking: boolean;
  stats: boolean;
}

function parseArgs(argv: string[]): Args {
  const a: Args = {
    from: DEFAULT_FROM,
    to: DEFAULT_TO,
    codes: [],
    sources: ["papacambridge", "notes", "pmt", "reddit"],
    redditSections: ["yearly", "topical", "notes", "book"],
    noReddit: false,
    noStaleMarking: false,
    stats: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const val = (def: string) => argv[++i] ?? def;
    switch (arg) {
      case "--from":
        a.from = Number(val("2009"));
        break;
      case "--to":
        a.to = Number(val(String(DEFAULT_TO)));
        break;
      case "--codes":
        a.codes = val("")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        break;
      case "--sources":
        a.sources = val("")
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
        break;
      case "--reddit-sections":
        a.redditSections = val("")
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
        break;
      case "--no-reddit":
        a.noReddit = true;
        break;
      case "--no-stale-marking":
        a.noStaleMarking = true;
        break;
      case "--stats":
        a.stats = true;
        break;
      default:
        if (arg.startsWith("-")) {
          console.warn(`unknown flag: ${arg}`);
        }
    }
  }
  if (a.noReddit) a.sources = a.sources.filter((s) => s !== "reddit");
  return a;
}

function printStats() {
  const s = stats();
  const d = db();
  console.log("\n=== Catalog ===");
  console.log(`total resources: ${s.total}`);
  const subs = d
    .prepare("SELECT code, name FROM subjects ORDER BY code")
    .all() as Array<{ code: string; name: string }>;
  for (const row of subs) {
    console.log(`  ${row.code} ${row.name}: ${s[`subject_${row.code}`] ?? 0}`);
  }
  console.log(
    `by type: ${["yearly", "topical", "notes", "book"]
      .map((t) => `${t}=${s[`type_${t}`] ?? 0}`)
      .join(" ")}`
  );
  const bySource = d
    .prepare(
      "SELECT source, COUNT(*) n FROM resources WHERE is_stale=0 GROUP BY source ORDER BY n DESC"
    )
    .all() as Array<{ source: string; n: number }>;
  console.log(
    "by source: " +
      bySource.map((r) => `${r.source}=${r.n}`).join(" ") +
      ` (stale: ${countResources({}) - s.total})`
  );
}

/**
 * Pre-scrape gate: refuse to touch a committed DB that's in WAL journal
 * mode. Vercel's serverless filesystem is read-only and can't open a WAL
 * DB even read-only (SQLite needs to create -wal/-shm sidecars), so a
 * scrape that flips the file into WAL mode silently breaks deployment.
 *
 * Per AGENTS.md: SQLite stores the journal mode in the file header at
 * offset 18. 1 = rollback (DELETE), 2 = WAL. We read that byte directly
 * so we don't have to open the DB through the driver.
 */
function assertRollbackMode(): void {
  let buf: Buffer;
  try {
    buf = readFileSync(dbPath());
  } catch {
    return; // fresh clone, no DB on disk yet — driver will create it
  }
  if (buf.length < 24) return; // not a real SQLite file yet
  const journalMode = buf.readUInt32BE(20);
  if (journalMode === 2) {
    console.error(
      [
        "",
        "  catalog is in WAL journal mode.",
        "",
        "  A WAL DB cannot be opened read-only on Vercel's serverless",
        "  filesystem (SQLite needs writable -wal/-shm sidecars).",
        "  Pushing this file would break every page at deploy time.",
        "",
        "  Fix locally:",
        "    sqlite3 data/alevelhub.db 'PRAGMA journal_mode=DELETE'",
        "  Then verify the header byte before committing:",
        "    xxd -s 18 -l 4 data/alevelhub.db    # should show 01000000",
        "",
        "  See AGENTS.md — \"Committed SQLite catalog\".",
        "",
      ].join("\n")
    );
    process.exit(1);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.stats) {
    printStats();
    closeDb();
    return;
  }
  if (args.to < args.from) {
    console.error("--to must be >= --from");
    process.exit(1);
  }

  assertRollbackMode();

  const t0 = Date.now();
  console.log(
    `A-Level Hub scrape — window ${args.from}–${args.to}, sources: ${args.sources.join(", ")}`
  );
  console.log(
    `subjects: ${SUBJECTS.filter(
      (s) => !args.codes.length || args.codes.includes(s.code)
    )
      .map((s) => s.code)
      .join(", ")}`
  );

  for (const source of args.sources) {
    switch (source) {
      case "papacambridge": {
        const r = await scrapePapaCambridge({
          fromYear: args.from,
          toYear: args.to,
          codes: args.codes,
          log: console.log,
        });
        console.log(
          `  ✓ papacambridge: ${r.filesFound} files (${r.sessionsDetected} sessions, ${r.probes} probes)`
        );
        break;
      }
      case "notes": {
        const n = await scrapeNotesPapaCambridge({
          codes: args.codes,
          log: console.log,
        });
        console.log(`  ✓ notes-papacambridge: ${n} files`);
        break;
      }
      case "pmt": {
        const n = await scrapePmt({ codes: args.codes, log: console.log });
        console.log(`  ✓ pmt: ${n} files`);
        break;
      }
      case "reddit": {
        const n = await scrapeReddit({
          codes: args.codes,
          sections: args.redditSections as never,
          log: console.log,
        });
        console.log(`  ✓ reddit: ${n} links`);
        break;
      }
      default:
        console.warn(`unknown source: ${source}`);
    }
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`\nDone in ${elapsed}s.`);
  printStats();
  closeDb();
}

main().catch((err) => {
  console.error(err);
  closeDb();
  process.exit(1);
});
