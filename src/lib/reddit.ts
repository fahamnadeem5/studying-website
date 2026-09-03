/**
 * Reddit helper used by both the batch scraper and the on-demand
 * `/api/live-search` route. Reddit's free tier (100 QPM, non-commercial)
 * is respected: one request per ~2s and in-memory dedupe of identical
 * in-flight queries.
 *
 * Credentials (all optional — Reddit is disabled when none are set):
 *   REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET
 *   plus one of:
 *     REDDIT_REFRESH_TOKEN            (web/installed app)
 *     REDDIT_USERNAME + REDDIT_PASSWORD  (script app — personal use)
 */

const OAUTH_URL = "https://www.reddit.com/api/v1/access_token";
const API_URL = "https://oauth.reddit.com";

let cachedToken: { token: string; expiresAt: number } | null = null;
const inflight = new Map<string, Promise<unknown>>();

export function redditConfigured(): boolean {
  return Boolean(
    process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET
  );
}

export function redditMissingHint(): string {
  return [
    "Reddit is not configured. Create a free app at",
    "https://www.reddit.com/prefs/apps (script type) and set",
    "REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME,",
    "REDDIT_PASSWORD in .env.local / environment.",
  ].join(" ");
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
  } else {
    params.set("grant_type", "client_credentials");
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

export async function searchReddit(
  query: string,
  opts: SearchOptions = {}
): Promise<RedditPost[]> {
  if (!redditConfigured()) throw new RedditError("not configured");
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
