/**
 * Reddit helper used by both the batch scraper and the on-demand
 * `/api/live-search` route.
 *
 * Three modes, picked automatically:
 *
 *   1. **Authenticated OAuth** — set REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET
 *      (+ REDDIT_REFRESH_TOKEN, or USERNAME+PASSWORD, or REDDIT_ALLOW_ANONYMOUS=1).
 *      100 QPM. Used for the heavy batch scraper.
 *
 *   2. **Public JSON** — no creds. Hits `reddit.com/r/<sub>/search.json`
 *      which is unauthenticated, capped at ~10 QPM and a custom User-Agent
 *      is required (Reddit returns 429/403 otherwise). This is what powers
 *      the on-site /api/live-search when there are no API keys.
 *
 *   3. **Disabled** — only the case when something throws.
 *
 * Identical in-flight queries are deduped, and public-mode queries are
 * serialised through a single-slot mutex to stay under the 10 QPM cap.
 */

const OAUTH_URL = "https://www.reddit.com/api/v1/access_token";
const API_URL = "https://oauth.reddit.com";
const PUBLIC_BASE = "https://www.reddit.com";
const PUBLIC_QPM = 10; // Reddit public JSON cap ≈10 req/min

let cachedToken: { token: string; expiresAt: number } | null = null;
const inflight = new Map<string, Promise<unknown>>();

/**
 * Returns true if Reddit search is available — either via
 * authenticated OAuth or the unauthenticated public JSON endpoint.
 *
 * Public mode is on by default (Reddit's `.json` endpoints need no key —
 * just a descriptive `User-Agent`). Set `REDDIT_FORCE_DISABLED=1` to
 * turn live search off entirely.
 */
export function redditConfigured(): boolean {
  if (process.env.REDDIT_FORCE_DISABLED === "1") return false;
  return true; // public `.json` is always available
}

export function redditMissingHint(): string {
  return [
    "Live Reddit search is disabled. Unset REDDIT_FORCE_DISABLED, or set",
    "REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET to upgrade to the authenticated",
    "tier (100 QPM).",
  ].join(" ");
}

function publicMode(): boolean {
  return !(
    process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET
  );
}

export class RedditError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "RedditError";
  }
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new RedditError("not configured");
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const params = new URLSearchParams();
  if (process.env.REDDIT_REFRESH_TOKEN) {
    params.set("grant_type", "refresh_token");
    params.set("refresh_token", process.env.REDDIT_REFRESH_TOKEN);
  } else if (process.env.REDDIT_USERNAME && process.env.REDDIT_PASSWORD) {
    params.set("grant_type", "password");
    params.set("username", process.env.REDDIT_USERNAME);
    params.set("password", process.env.REDDIT_PASSWORD);
  } else if (process.env.REDDIT_ALLOW_ANONYMOUS === "1") {
    params.set("grant_type", "client_credentials");
  } else {
    throw new RedditError(
      "Reddit credentials incomplete. Set REDDIT_REFRESH_TOKEN, " +
      "or REDDIT_USERNAME + REDDIT_PASSWORD, " +
      "or REDDIT_ALLOW_ANONYMOUS=1 to opt in to anonymous read-only mode."
    );
  }

  const res = await fetch(OAUTH_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": userAgent(),
    },
    body: params.toString(),
  });
  const json = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
  };
  if (!res.ok || !json.access_token) {
    throw new RedditError(
      `token request failed (${res.status}): ${json.error ?? res.statusText}`,
      res.status
    );
  }
  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
  return cachedToken.token;
}

function userAgent(): string {
  const u = process.env.REDDIT_USERNAME ?? "alevelhub";
  return `web:alevelhub:v1.0 (by /u/${u})`;
}

export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  url: string;
  permalink: string;
  subreddit: string;
  author: string;
  score: number;
  numComments: number;
  createdUtc: number;
  over18: boolean;
}

interface SearchOptions {
  subreddit?: string; // restrict search to a subreddit
  sort?: "relevance" | "top" | "new";
  limit?: number;
  after?: string;
}

/**
 * Search Reddit. Routes to authenticated OAuth (creds set) or
 * public `.json` endpoint (no creds). The public path is rate-
 * limited (~10 QPM) — in-flight identical queries are deduped
 * AND global `publicMutex` serialises public calls.
 */
export async function searchReddit(
  query: string,
  opts: SearchOptions = {}
): Promise<RedditPost[]> {
  if (!redditConfigured()) throw new RedditError("not configured");
  const key = JSON.stringify({ query, opts });
  const prior = inflight.get(key);
  if (prior) return prior as Promise<RedditPost[]>;

  const p = publicMode()
    ? doSearchPublic(query, opts)
    : doSearchOAuth(query, opts);
  inflight.set(key, p);
  try {
    return await p;
  } finally {
    inflight.delete(key);
  }
}

async function doSearch(
  query: string,
  opts: SearchOptions
): Promise<RedditPost[]> {
  const token = await getAccessToken();
  const path = opts.subreddit
    ? `/r/${opts.subreddit}/search`
    : "/search";
  const qs = new URLSearchParams({
    q: query,
    sort: opts.sort ?? "relevance",
    t: "all",
    limit: String(opts.limit ?? 25),
    raw_json: "1",
  });
  if (opts.subreddit) qs.set("restrict_sr", "1");
  if (opts.after) qs.set("after", opts.after);

  const res = await fetch(`${API_URL}${path}?${qs}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": userAgent(),
    },
    signal: AbortSignal.timeout(25_000),
  });
  if (res.status === 429) {
    // free tier: back off and retry once
    await new Promise((r) => setTimeout(r, 3500));
    return doSearch(query, opts);
  }
  if (!res.ok) throw new RedditError(`search failed (${res.status})`, res.status);
  const json = (await res.json()) as {
    data?: { children?: Array<{ kind: string; data: Record<string, unknown> }> };
  };
  const children = json.data?.children ?? [];
  return children
    .filter((c) => c.kind === "t3")
    .map((c) => postFromRaw(c.data))
    .filter(Boolean) as RedditPost[];
}

function postFromRaw(d: Record<string, unknown>): RedditPost | null {
  if (!d.title) return null;
  return {
    id: String(d.id ?? ""),
    title: String(d.title),
    selftext: String(d.selftext ?? ""),
    url: String(d.url ?? ""),
    permalink: String(d.permalink ?? ""),
    subreddit: String(d.subreddit ?? ""),
    author: String(d.author ?? "[deleted]"),
    score: Number(d.score ?? 0),
    numComments: Number(d.num_comments ?? 0),
    createdUtc: Number(d.created_utc ?? 0),
    over18: Boolean(d.over_18),
  };
}

/* ------------------------- link extraction & normalization --------------- */

const FILE_LINK_RE =
  /https?:\/\/[^\s<>"')}\]]+/gi;

const ALLOWED_HOST_PATTERNS = [
  /^drive\.google\.com$/,
  /^docs\.google\.com$/,
  /^mega\.nz$/,
  /^mediafire\.com$/,
  /^dropbox\.com$/,
  /^dl\.dropboxusercontent\.com$/,
  /^archive\.org$/,
  /^box\.com$/,
  /^4shared\.com$/,
];

const BLOCKED_HOST_PATTERNS = [
  /reddit\.com$/,
  /youtube\.com$/,
  /youtu\.be$/,
  /i\.redd\.it$/,
  /v\.redd\.it$/,
  /preview\.redd\.it$/,
  /discord\.gg$/,
  /t\.me$/,
  /paypal|patreon|ko-fi|buymeacoffee/i,
  /google\.com\/(search|maps|accounts|amp)/,
];

/** Normalize a Google Drive URL into a stable, viewable form. */
export function normalizeLink(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase();
  if (BLOCKED_HOST_PATTERNS.some((re) => re.test(host))) return null;
  const allowed =
    ALLOWED_HOST_PATTERNS.some((re) => re.test(host)) ||
    /\.pdf$|\.zip$/i.test(u.pathname);
  if (!allowed) return null;

  // google drive /docs normalization
  if (/drive\.google\.com$/i.test(host)) {
    const fileM = /\/file\/d\/([^/]+)\//.exec(u.pathname);
    if (fileM) return `https://drive.google.com/file/d/${fileM[1]}/view`;
    const openId = u.searchParams.get("id");
    if (u.pathname.startsWith("/open") && openId) {
      return `https://drive.google.com/file/d/${openId}/view`;
    }
    if (u.pathname.startsWith("/uc") && openId) {
      return `https://drive.google.com/file/d/${openId}/view`;
    }
    if (u.pathname.startsWith("/folderview") && openId) {
      return `https://drive.google.com/drive/folders/${openId}`;
    }
    return u.href;
  }
  if (/docs\.google\.com$/i.test(host)) {
    // keep document/spreadsheet view links as-is
    return u.href;
  }
  return u.href;
}

/** Pull candidate file links out of free text (e.g. a Reddit selftext). */
export function extractFileLinks(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const m of text.matchAll(FILE_LINK_RE)) {
    const clean = m[0].replace(/[.,;]+$/, "");
    if (clean.length > 512) continue;
    const norm = normalizeLink(clean);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      out.push(norm);
    }
  }
  return out;
}

/* ── Public JSON search (~10 QPM, no API key) ──────────────────────────── */
let publicMutex = Promise.resolve();

async function doSearchPublic(
  query: string,
  opts: SearchOptions
): Promise<RedditPost[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  // rate-limit: serialise through a single-slot mutex
  publicMutex = publicMutex.then(() => delay(PUBLIC_QPM)).catch(() => {});
  await publicMutex;

  const subreddit = opts.subreddit ?? "alevel";
  const url = new URL(`${PUBLIC_BASE}/r/${subreddit}/search.json`);
  url.searchParams.set("q", q);
  url.searchParams.set("restrict_sr", "1");
  url.searchParams.set("sort", opts.sort ?? "relevance");
  url.searchParams.set("t", "all");
  url.searchParams.set("limit", String(opts.limit ?? 25));

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "alevelhub:public-search:v1.0" },
    signal: AbortSignal.timeout(20_000),
  });

  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 6_000));
    return await doSearchPublic(query, opts); // retry once
  }
  if (!res.ok) return [];

  const json = (await res.json()) as {
    data?: { children?: Array<{ kind: string; data: Record<string, unknown> }> };
  };
  const children = json.data?.children ?? [];
  return children
    .filter((c) => c.kind === "t3")
    .map((c) => postFromRaw(c.data))
    .filter(Boolean) as RedditPost[];
}

/* ── OAuth search (existing, unchanged save for rate guard) ─────────────── */
async function doSearchOAuth(
  query: string,
  opts: SearchOptions
): Promise<RedditPost[]> {
  const key = JSON.stringify({ query, opts });
  const prior = inflight.get(key);
  if (prior) return prior as Promise<RedditPost[]>;

  const p = doSearch(query, opts);
  inflight.set(key, p);
  try {
    return await p;
  } finally {
    inflight.delete(key);
  }
}

/** Simple delay helper for QPM throttling. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ----------------------------- classification --------------------------- */

export type RedditKindHint = "yearly" | "topical" | "notes" | "book";

const BOOK_WORDS = /(textbook|coursebook|student'?s? ?book|book pdf|hodder|edition|cambridge book|cgp)/i;
const TOPICAL_WORDS = /(topical|by ?topic|questions? ?by ?topic|per ?topic)/i;
const NOTES_WORDS = /(notes|summary|summaries|revision notes|concise)/i;
const YEARLY_WORDS =
  /(past ?paper|pastpaper|qp_|ms_|_s\d{2}_|_w\d{2}_|_m\d{2}_|question paper|mark scheme)/i;

/**
 * Guess the catalog section a Reddit post belongs to. Falls back to the
 * hint from the query that surfaced the post.
 */
export function classifyPost(
  post: Pick<RedditPost, "title" | "selftext">,
  hint: RedditKindHint
): RedditKindHint {
  const text = `${post.title} ${post.selftext}`.slice(0, 4000);
  const scores: Record<RedditKindHint, number> = {
    topical: (text.match(TOPICAL_WORDS) ?? []).length * 2,
    book: (text.match(BOOK_WORDS) ?? []).length * 2,
    notes: (text.match(NOTES_WORDS) ?? []).length * 2,
    yearly: (text.match(YEARLY_WORDS) ?? []).length,
  };
  const best = (Object.keys(scores) as RedditKindHint[]).reduce((a, b) =>
    scores[b] > scores[a] ? b : a
  );
  if (scores[best] === 0) return hint;
  // if signals exist but hint also matches equally, prefer post content
  return scores[best] > scores[hint] ? best : hint;
}
