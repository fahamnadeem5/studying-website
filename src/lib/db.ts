import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { SUBJECTS } from "./subjects";
import type {
  NewResource,
  ResourceRow,
  ResourceType,
  SessionLetter,
  SubjectCounts,
} from "./types";

const DEFAULT_DB = resolve(process.cwd(), "data", "alevelhub.db");

let _db: DatabaseSync | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS subjects (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'AS & A Level'
);

CREATE TABLE IF NOT EXISTS resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_code TEXT NOT NULL REFERENCES subjects(code),
  type TEXT NOT NULL CHECK (type IN ('yearly','topical','notes','book')),
  title TEXT NOT NULL,
  year INTEGER,
  session TEXT CHECK (session IN ('m','s','w') OR session IS NULL),
  paper TEXT,
  variant INTEGER,
  kind TEXT NOT NULL DEFAULT 'other'
    CHECK (kind IN ('qp','ms','gt','in','er','syllabus','other')),
  topic TEXT,
  source TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  metadata TEXT,
  first_seen TEXT NOT NULL DEFAULT (datetime('now')),
  last_verified TEXT NOT NULL DEFAULT (datetime('now')),
  is_stale INTEGER NOT NULL DEFAULT 0,
  UNIQUE (source, url)
);

CREATE INDEX IF NOT EXISTS idx_resources_subject_type ON resources (subject_code, type);
CREATE INDEX IF NOT EXISTS idx_resources_year ON resources (year);
CREATE INDEX IF NOT EXISTS idx_resources_topic ON resources (topic);
CREATE INDEX IF NOT EXISTS idx_resources_kind ON resources (kind);

CREATE VIRTUAL TABLE IF NOT EXISTS resources_fts USING fts5(
  title, topic, paper, description,
  content='resources', content_rowid='id',
  tokenize='porter unicode61'
);

CREATE TRIGGER IF NOT EXISTS resources_ai AFTER INSERT ON resources BEGIN
  INSERT INTO resources_fts(rowid, title, topic, paper, description)
  VALUES (new.id, new.title, new.topic, new.paper, new.description);
END;
CREATE TRIGGER IF NOT EXISTS resources_ad AFTER DELETE ON resources BEGIN
  INSERT INTO resources_fts(resources_fts, rowid, title, topic, paper, description)
  VALUES ('delete', old.id, old.title, old.topic, old.paper, old.description);
END;
CREATE TRIGGER IF NOT EXISTS resources_au AFTER UPDATE ON resources BEGIN
  INSERT INTO resources_fts(resources_fts, rowid, title, topic, paper, description)
  VALUES ('delete', old.id, old.title, old.topic, old.paper, old.description);
  INSERT INTO resources_fts(rowid, title, topic, paper, description)
  VALUES (new.id, new.title, new.topic, new.paper, new.description);
END;
`;

function seedSubjects(db: DatabaseSync) {
  const upsert = db.prepare(
    `INSERT INTO subjects (code, name, short_name, level) VALUES (?, ?, ?, ?)
     ON CONFLICT(code) DO UPDATE SET name=excluded.name, short_name=excluded.short_name, level=excluded.level`
  );
  for (const s of SUBJECTS) {
    upsert.run(s.code, s.name, s.shortName, s.level);
  }
}

function open(path: string): DatabaseSync {
  const parent = dirname(path);
  if (parent && !existsSync(parent)) {
    try {
      mkdirSync(parent, { recursive: true });
    } catch {
      /* read-only fs: will fall back to read-only open below */
    }
  }
  const fail = (stage: string, e: unknown) =>
    console.error(`[db] ${stage} failed: ${(e as Error).message}`);

  // 1) Writable handle (local dev, scrapers). Enabling WAL requires a
  //    writable directory for the -wal/-shm sidecars, so this only ever
  //    succeeds where writes are allowed.
  try {
    const db = new DatabaseSync(path);
    db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    db.exec(SCHEMA);
    seedSubjects(db);
    return db;
  } catch (e) {
    fail("writable open", e);
  }
  // 2) Read-only handle (serverless / read-only filesystems). The committed
  //    catalog ships in rollback-journal (DELETE) mode, so a read-only open
  //    needs no sidecar files and cannot hit SQLITE_CANTOPEN.
  try {
    const db = new DatabaseSync(path, { readOnly: true });
    // Schema/seed are guaranteed present in a committed DB; a read-only
    // handle cannot create tables, so skip straight to using it.
    return db;
  } catch (e) {
    fail("read-only open", e);
  }
  // 3) No DB on disk at all (fresh clone / tracing didn't ship it): serve an
  //    empty in-memory catalog so the site still renders (empty states).
  try {
    const mem = new DatabaseSync(":memory:");
    mem.exec(SCHEMA);
    seedSubjects(mem);
    return mem;
  } catch (e) {
    fail("in-memory fallback", e);
    throw new Error(`A-Level Hub catalog unavailable: ${(e as Error).message}`);
  }
}

export function db(): DatabaseSync {
  if (!_db) {
    _db = open(process.env.ALEVELHUB_DB ?? DEFAULT_DB);
  }
  return _db;
}

export function dbPath(): string {
  return process.env.ALEVELHUB_DB ?? DEFAULT_DB;
}

export function closeDb() {
  try {
    _db?.close();
  } catch {
    /* noop */
  }
  _db = null;
}

/* ------------------------------- writers -------------------------------- */

export interface UpsertResult {
  action: "added" | "updated" | "skipped";
}

export function upsertResource(r: NewResource): UpsertResult {
  const d = db();
  const existing = d
    .prepare("SELECT id, url FROM resources WHERE source = ? AND url = ?")
    .get(r.source, r.url) as { id: number } | undefined;

  const meta = r.metadata ? JSON.stringify(r.metadata) : null;
  const kind = r.kind ?? "other";
  const title = r.title.trim();
  if (!title || !r.url) return { action: "skipped" };

  if (existing) {
    d.prepare(
      `UPDATE resources SET last_verified = datetime('now'), is_stale = 0,
         title = ?, type = ?, year = ?, session = ?, paper = ?, variant = ?, kind = ?,
         topic = ?, description = ?, metadata = COALESCE(?, metadata)
       WHERE id = ?`
    ).run(
      title,
      r.type,
      r.year ?? null,
      r.session ?? null,
      r.paper ?? null,
      r.variant ?? null,
      kind,
      r.topic ?? null,
      r.description ?? null,
      meta,
      existing.id
    );
    return { action: "updated" };
  }

  d.prepare(
    `INSERT INTO resources
       (subject_code, type, title, year, session, paper, variant, kind, topic, source, url, description, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    r.subjectCode,
    r.type,
    title,
    r.year ?? null,
    r.session ?? null,
    r.paper ?? null,
    r.variant ?? null,
    kind,
    r.topic ?? null,
    r.source,
    r.url,
    r.description ?? null,
    meta
  );
  return { action: "added" };
}

export function markStale(source: string, keepUrls: Set<string>) {
  // Resources from `source` that were not seen in the latest run get flagged.
  if (keepUrls.size === 0) return;
  const rows = db()
    .prepare("SELECT id, url FROM resources WHERE source = ?")
    .all(source) as { id: number; url: string }[];
  const update = db().prepare(
    "UPDATE resources SET is_stale = 1 WHERE id = ?"
  );
  for (const row of rows) {
    if (!keepUrls.has(row.url)) update.run(row.id);
  }
}

/* ------------------------------- readers -------------------------------- */

const ROW_COLS = `id, subject_code, type, title, year, session, paper, variant,
  kind, topic, source, url, description, metadata, first_seen, last_verified`;

function rowMapper(row: Record<string, unknown> | undefined): ResourceRow | null {
  if (!row) return null;
  return {
    id: row.id as number,
    subject_code: row.subject_code as string,
    type: row.type as ResourceType,
    title: row.title as string,
    year: (row.year as number | null) ?? null,
    session: (row.session as SessionLetter | null) ?? null,
    paper: (row.paper as string | null) ?? null,
    variant: (row.variant as number | null) ?? null,
    kind: (row.kind as ResourceRow["kind"]) ?? "other",
    topic: (row.topic as string | null) ?? null,
    source: row.source as string,
    url: row.url as string,
    description: (row.description as string | null) ?? null,
    metadata: (row.metadata as string | null) ?? null,
    first_seen: row.first_seen as string,
    last_verified: row.last_verified as string,
  };
}

export interface ListOptions {
  subjectCode: string;
  type?: ResourceType;
  year?: number;
  session?: SessionLetter;
  kind?: string;
  topic?: string;
  source?: string;
  paper?: string;
  limit?: number;
  offset?: number;
}

export function listResources(opts: ListOptions): ResourceRow[] {
  const where: string[] = ["subject_code = ?"];
  const params: (string | number)[] = [opts.subjectCode];
  if (opts.type) {
    where.push("type = ?");
    params.push(opts.type);
  }
  if (opts.year) {
    where.push("year = ?");
    params.push(opts.year);
  }
  if (opts.session) {
    where.push("session = ?");
    params.push(opts.session);
  }
  if (opts.kind) {
    where.push("kind = ?");
    params.push(opts.kind);
  }
  if (opts.paper) {
    where.push("paper = ?");
    params.push(opts.paper);
  }
  if (opts.topic) {
    where.push("topic LIKE ?");
    params.push(`%${opts.topic}%`);
  }
  if (opts.source) {
    where.push("source = ?");
    params.push(opts.source);
  }
  where.push("is_stale = 0");
  const limit = opts.limit ?? 500;
  params.push(limit, opts.offset ?? 0);
  const rows = db()
    .prepare(
      `SELECT ${ROW_COLS} FROM resources
       WHERE ${where.join(" AND ")}
       ORDER BY year DESC, session, kind, paper
       LIMIT ? OFFSET ?`
    )
    .all(...params) as Record<string, unknown>[];
  return rows.map(rowMapper).filter(Boolean) as ResourceRow[];
}

export function countResources(opts: {
  subjectCode?: string;
  type?: ResourceType;
  source?: string;
}): number {
  const where: string[] = ["1=1", "is_stale = 0"];
  const params: string[] = [];
  if (opts.subjectCode) {
    where.push("subject_code = ?");
    params.push(opts.subjectCode);
  }
  if (opts.type) {
    where.push("type = ?");
    params.push(opts.type);
  }
  if (opts.source) {
    where.push("source = ?");
    params.push(opts.source);
  }
  const row = db()
    .prepare(`SELECT COUNT(*) AS n FROM resources WHERE ${where.join(" AND ")}`)
    .get(...params) as { n: number };
  return row.n;
}

export function subjectCounts(subjectCode: string): SubjectCounts {
  const d = db();
  const rows = d
    .prepare(
      `SELECT type, COUNT(*) AS n FROM resources
       WHERE subject_code = ? AND is_stale = 0
       GROUP BY type`
    )
    .all(subjectCode) as { type: ResourceType; n: number }[];
  const out: SubjectCounts = {
    yearly: 0,
    topical: 0,
    notes: 0,
    book: 0,
    total: 0,
  };
  for (const r of rows) {
    out[r.type] = r.n;
    out.total += r.n;
  }
  return out;
}

export function subjectSessions(subjectCode: string): SessionLetter[] {
  const rows = db()
    .prepare(
      `SELECT DISTINCT session FROM resources
       WHERE subject_code = ? AND is_stale = 0 AND session IS NOT NULL`
    )
    .all(subjectCode) as Array<{ session: string }>;
  const present = new Set(rows.map((r) => r.session));
  return (["m", "s", "w"] as SessionLetter[]).filter((l) =>
    present.has(l)
  );
}

export function subjectSources(subjectCode: string, type?: ResourceType): string[] {
  const rows = db()
    .prepare(
      `SELECT DISTINCT source FROM resources
       WHERE subject_code = ? AND is_stale = 0 ${type ? "AND type = ?" : ""}
       ORDER BY source`
    )
    .all(...(type ? [subjectCode, type] : [subjectCode])) as Array<{
    source: string;
  }>;
  return rows.map((r) => r.source);
}

export function subjectYears(subjectCode: string): number[] {
  const rows = db()
    .prepare(
      `SELECT DISTINCT year FROM resources
       WHERE subject_code = ? AND is_stale = 0 AND year IS NOT NULL
       ORDER BY year DESC`
    )
    .all(subjectCode) as { year: number }[];
  return rows.map((r) => r.year);
}

/* ------------------------------- search --------------------------------- */

function ftsToken(tok: string): string {
  return `"${tok.replace(/"/g, '""')}"`;
}

/** Escape a raw user query into an FTS5 MATCH expression. */
export function ftsQuery(raw: string): string | null {
  const tokens = raw
    .trim()
    .split(/\s+/)
    .map((t) => t.replace(/[^\p{L}\p{N}_.-]/gu, ""))
    .filter((t) => t.length > 0);
  if (tokens.length === 0) return null;
  return tokens.map(ftsToken).join(" AND ");
}

export interface SearchOptions {
  subjectCode?: string;
  type?: ResourceType;
  limit?: number;
}

export function searchResources(
  rawQuery: string,
  opts: SearchOptions = {}
): ResourceRow[] {
  const match = ftsQuery(rawQuery);
  if (!match) return [];
  const where = ["resources_fts MATCH ?", "resources.is_stale = 0"];
  const params: (string | number)[] = [match];
  if (opts.subjectCode) {
    where.push("resources.subject_code = ?");
    params.push(opts.subjectCode);
  }
  if (opts.type) {
    where.push("resources.type = ?");
    params.push(opts.type);
  }
  const limit = opts.limit ?? 60;
  params.push(limit);
  const rows = db()
    .prepare(
      `SELECT ${ROW_COLS.split(", ").map((c) => "resources." + c).join(", ")},
              bm25(resources_fts) AS rank
       FROM resources
       JOIN resources_fts ON resources_fts.rowid = resources.id
       WHERE ${where.join(" AND ")}
       ORDER BY rank
       LIMIT ?`
    )
    .all(...params) as Record<string, unknown>[];
  return rows.map(rowMapper).filter(Boolean) as ResourceRow[];
}

/** Fallback: substring search over title/topic for queries FTS can't parse. */
export function likeSearch(
  rawQuery: string,
  opts: SearchOptions = {}
): ResourceRow[] {
  const q = `%${rawQuery.trim()}%`;
  const where = ["(title LIKE ? OR topic LIKE ? OR paper LIKE ?)", "is_stale = 0"];
  const params: string[] = [q, q, q];
  if (opts.subjectCode) {
    where.push("subject_code = ?");
    params.push(opts.subjectCode);
  }
  if (opts.type) {
    where.push("type = ?");
    params.push(opts.type);
  }
  const limit = opts.limit ?? 60;
  params.push(String(limit));
  const rows = db()
    .prepare(
      `SELECT ${ROW_COLS} FROM resources
       WHERE ${where.join(" AND ")}
       ORDER BY year DESC, id DESC LIMIT ?`
    )
    .all(...params) as Record<string, unknown>[];
  return rows.map(rowMapper).filter(Boolean) as ResourceRow[];
}

/* ------------------------------- live-search cache ------------------------ */

export interface CachedSearch {
  query: string;
  resultsJson: string;
  expiresAt: number;
}

function ensureCacheTable() {
  const d = db();
  try {
    d.exec(`CREATE TABLE IF NOT EXISTS search_cache (
      query TEXT PRIMARY KEY,
      results_json TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    )`);
  } catch {
    /* read-only filesystem (serverless): caching disabled */
  }
}

export function cacheGet(query: string): CachedSearch | null {
  ensureCacheTable();
  try {
    const row = db()
      .prepare(
        "SELECT query, results_json AS resultsJson, expires_at AS expiresAt FROM search_cache WHERE query = ?"
      )
      .get(query) as CachedSearch | undefined;
    if (!row) return null;
    if (row.expiresAt < Date.now()) return null;
    return row;
  } catch {
    return null;
  }
}

export function cacheSet(query: string, resultsJson: string, ttlMs: number) {
  ensureCacheTable();
  try {
    db()
      .prepare(
        `INSERT INTO search_cache (query, results_json, expires_at)
         VALUES (?, ?, ?)
         ON CONFLICT(query) DO UPDATE SET
           results_json = excluded.results_json,
           expires_at = excluded.expires_at`
      )
      .run(query, resultsJson, Date.now() + ttlMs);
  } catch {
    /* read-only filesystem: caching disabled */
  }
}

/* --------------------------------- stats -------------------------------- */

export function stats(): Record<string, number> {
  const d = db();
  const total = d.prepare(
    "SELECT COUNT(*) AS n FROM resources WHERE is_stale = 0"
  ).get() as { n: number };
  const bySubject = d.prepare(
    `SELECT subject_code, COUNT(*) AS n FROM resources
     WHERE is_stale = 0 GROUP BY subject_code ORDER BY subject_code`
  ).all() as { subject_code: string; n: number }[];
  const byType = d.prepare(
    `SELECT type, COUNT(*) AS n FROM resources WHERE is_stale = 0 GROUP BY type`
  ).all() as { type: string; n: number }[];
  const out: Record<string, number> = { total: total.n, last_updated: 0 };
  for (const r of bySubject) out[`subject_${r.subject_code}`] = r.n;
  for (const r of byType) out[`type_${r.type}`] = r.n;
  const fresh = d
    .prepare(
      "SELECT COALESCE(MAX(last_verified), '') AS mx FROM resources"
    )
    .get() as { mx: string };
  out.last_updated = fresh.mx ? new Date(fresh.mx + "Z").getTime() : 0;
  return out;
}
