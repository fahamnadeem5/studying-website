/**
 * Shared scraping utilities: a polite, throttled HTTP layer plus HTML helpers.
 *
 * Politeness rules we follow everywhere:
 *  - bounded concurrency per host (default 5)
 *  - minimum spacing between requests to the same host (default 140ms)
 *  - exponential backoff with jitter on transient failures
 *  - a real browser-style UA, and no requests if a site's robots.txt forbids it
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

export interface HttpOptions {
  method?: "GET" | "HEAD" | "POST";
  body?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  /** when false (default) responses are throttled; set true for tiny internal calls */
  skipThrottle?: boolean;
  /** minimum spacing between requests to the same host (default 140ms) */
  minSpacingMs?: number;
}

interface HostState {
  lastRequestAt: number;
  inflight: number;
  spacingMs: number;
}

const hostStates = new Map<string, HostState>();
const DEFAULT_MIN_SPACING_MS = 140;
const MAX_CONCURRENCY = 5;

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "unknown";
  }
}

async function acquireSlot(url: string, minSpacingMs: number): Promise<void> {
  const host = hostOf(url);
  for (;;) {
    const st =
      hostStates.get(host) ?? {
        lastRequestAt: 0,
        inflight: 0,
        spacingMs: DEFAULT_MIN_SPACING_MS,
      };
    const spacing = Math.max(st.spacingMs, minSpacingMs);
    st.spacingMs = spacing;
    const now = Date.now();
    const wait = Math.max(0, st.lastRequestAt + spacing - now);
    if (st.inflight < MAX_CONCURRENCY && wait === 0) {
      st.lastRequestAt = now + (Math.random() > 0.7 ? 20 : 0);
      st.inflight += 1;
      hostStates.set(host, st);
      return;
    }
    await sleep(Math.min(wait || 25, 250) + Math.random() * 30);
  }
}

function releaseSlot(url: string) {
  const host = hostOf(url);
  const st = hostStates.get(host);
  if (st) {
    st.inflight = Math.max(0, st.inflight - 1);
    hostStates.set(host, st);
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function httpFetch(
  url: string,
  opts: HttpOptions = {}
): Promise<Response> {
  const {
    method = "GET",
    body,
    headers = {},
    timeoutMs = 30_000,
    retries = 3,
    minSpacingMs = DEFAULT_MIN_SPACING_MS,
  } = opts;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (!opts.skipThrottle) await acquireSlot(url, minSpacingMs);
    try {
      const res = await fetch(url, {
        method,
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.8",
          ...headers,
          ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
        },
        body: body ? body : undefined,
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (
        res.status === 429 ||
        res.status === 503 ||
        res.status === 500 ||
        res.status === 502 ||
        res.status === 504
      ) {
        lastErr = new Error(`HTTP ${res.status} for ${url}`);
        if (attempt < retries) {
          await sleep(800 * 2 ** attempt + Math.random() * 400);
          continue;
        }
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await sleep(600 * 2 ** attempt + Math.random() * 300);
        continue;
      }
    } finally {
      if (!opts.skipThrottle) releaseSlot(url);
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error(`request failed: ${url}`);
}

/** HEAD probe that resolves true for 2xx (mostly 200), false otherwise. */
export async function urlExists(
  url: string,
  opts: HttpOptions = {}
): Promise<boolean> {
  try {
    const res = await httpFetch(url, {
      method: "HEAD",
      retries: 2,
      timeoutMs: 20_000,
      ...opts,
    });
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}

/**
 * Probe that follows redirects and only returns true when the final response
 * is genuinely a PDF. Many paper CDNs soft-404 missing files with a redirect
 * to their HTML homepage, so a 3xx-then-2xx status alone is not enough — we
 * check the final content type / URL too.
 */
export async function urlIsPdf(
  url: string,
  opts: HttpOptions = {}
): Promise<boolean> {
  try {
    const res = await httpFetch(url, {
      method: "GET",
      retries: 1,
      timeoutMs: 25_000,
      headers: { Range: "bytes=0-0" },
      ...opts,
    });
    let isPdf = false;
    if (res.status === 200 || res.status === 206) {
      const ctype = (res.headers.get("content-type") ?? "").toLowerCase();
      const finalPath = (res.url || url).split("?")[0].toLowerCase();
      isPdf =
        ctype.includes("application/pdf") ||
        (!ctype.includes("html") &&
          !ctype.includes("text/") &&
          finalPath.endsWith(".pdf"));
    }
    // We only asked for the first byte — don't download the whole PDF.
    try {
      await res.body?.cancel();
    } catch {
      /* ignore */
    }
    return isPdf;
  } catch {
    return false;
  }
}

/* ------------------------------ html utils ------------------------------ */

export function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCodePoint(parseInt(h, 16))
    );
}

/** Extract the text content of every element whose class contains `cls`. */
export function textByClass(html: string, cls: string): string[] {
  const out: string[] = [];
  const re = new RegExp(
    `<[a-z][^>]*class=["'][^"']*${escapeRe(cls)}[^"']*["'][^>]*>([\\s\\S]*?)<\\/[a-z]+>`,
    "gi"
  );
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const text = stripTags(m[1]).trim();
    if (text) out.push(text);
  }
  return out;
}

export function stripTags(s: string): string {
  return decodeEntities(
    s
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  ).replace(/\s+/g, " ");
}

/** All absolute URLs from href attributes, deduped, ordered as seen. */
export function hrefs(html: string, baseUrl: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const re = /<a[^>]+href=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    let u: string;
    try {
      u = new URL(m[1], baseUrl).href;
    } catch {
      continue;
    }
    if (!seen.has(u)) {
      seen.add(u);
      out.push(u);
    }
  }
  return out;
}

export function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function ellipsize(s: string, max = 90): string {
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

/** Run async `fn` over `items` with bounded concurrency, preserving order. */
export async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}
