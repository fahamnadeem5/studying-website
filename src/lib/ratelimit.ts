/**
 * Tiny in-process rate limiter. Per-IP sliding window with a Map of
 * timestamps. Good enough for Vercel per-region, ephemeral, and
 * per-instance — no shared state needed. For a multi-region site
 * swap this for Upstash / Vercel KV, but until then this blocks
 * the obvious abuse patterns (single user spamming the same query
 * a hundred times, scrapers hitting /api/search with 50 RPS).
 *
 * Usage:
 *   const limited = rateLimit(req, { key: "search", limit: 30, windowMs: 60_000 });
 *   if (limited) return NextResponse.json({ error: "rate-limited" }, { status: 429 });
 */
interface Bucket {
  ts: number[];
}
const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** bucket key — usually "search", "live-search", "command-palette" */
  key: string;
  /** max requests in the window */
  limit: number;
  /** window length in ms */
  windowMs: number;
  /** override the IP (e.g. if you've already derived one) */
  ip?: string;
}

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetMs: number;
}

export function rateLimit(req: Request, opts: RateLimitOptions): RateLimitResult {
  const ip = opts.ip ?? clientIp(req);
  const id = `${opts.key}:${ip}`;
  const now = Date.now();
  const cutoff = now - opts.windowMs;

  let bucket = buckets.get(id);
  if (!bucket) {
    bucket = { ts: [] };
    buckets.set(id, bucket);
  }
  // drop expired timestamps
  bucket.ts = bucket.ts.filter((t) => t > cutoff);

  if (bucket.ts.length >= opts.limit) {
    const resetMs = bucket.ts[0] + opts.windowMs - now;
    return { limited: true, remaining: 0, resetMs };
  }
  bucket.ts.push(now);
  return { limited: false, remaining: opts.limit - bucket.ts.length, resetMs: opts.windowMs };
}

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xri = req.headers.get("x-real-ip");
  if (xri) return xri.trim();
  // Vercel-specific
  const vcf = req.headers.get("x-vercel-forwarded-for");
  if (vcf) return vcf.split(",")[0].trim();
  return "unknown";
}
