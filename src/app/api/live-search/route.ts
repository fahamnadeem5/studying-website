import { NextResponse } from "next/server";
import { searchReddit } from "@/lib/reddit";
import { getSubject } from "@/lib/subjects";
import { rateLimit } from "@/lib/ratelimit";
import type { SubjectMeta } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/live-search?q=...&subject=9709
 * Searches Reddit right now (r/alevel + friends). Uses
 * Reddit's public `.json` endpoint — no API key needed.
 * Rate-limited: 15 req / 60s per IP (each call costs a Reddit
 * public-JSON request, so we keep this tighter than /api/search).
 */
export async function GET(req: Request) {
  const limited = rateLimit(req, { key: "live-search", limit: 15, windowMs: 60_000 });
  if (limited.limited) {
    return NextResponse.json(
      { error: "Too many live-search requests. Try again in a moment.", retryAfter: Math.ceil(limited.resetMs / 1000) },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limited.resetMs / 1000)) } }
    );
  }

  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") ?? "").trim().slice(0, 200);
  const subjectCode = sp.get("subject") ?? undefined;
  if (q.length < 3) {
    return NextResponse.json({ query: q, posts: [] });
  }

  const subject: SubjectMeta | undefined = subjectCode
    ? getSubject(subjectCode)
    : undefined;

  const posts = await searchReddit(q, {
    subreddit: "alevel",
    sort: "relevance",
    limit: 25,
  });

  const results: Array<{
    id: string;
    title: string;
    url: string;
    permalink: string;
    subreddit: string;
    author: string;
    score: number;
    numComments: number;
    createdUtc: number;
    type: string;
    links: string[];
  }> = [];

  for (const p of posts) {
    const text = `${p.title}\n${p.selftext}`;
    const links = extractFileLinks(text);
    const postLinks =
      links.length > 0
        ? links
        : /\.pdf$|\.zip$|drive\.google\.com|mega\.nz/i.test(p.url)
          ? [p.url]
          : [];
    if (postLinks.length === 0) continue;
    if (subject && !mentionsSubject(`${p.title} ${p.selftext}`, subject)) {
      continue;
    }
    results.push({
      id: p.id,
      title: p.title,
      url: postLinks[0],
      permalink: `https://www.reddit.com${p.permalink}`,
      subreddit: p.subreddit,
      author: p.author,
      score: p.score,
      numComments: p.numComments,
      createdUtc: p.createdUtc,
      type: classifyPost(p),
      links: postLinks.slice(0, 8),
    });
  }

  return NextResponse.json({ query: q, cached: false, posts: results });
}

/* ── reused helpers (duplicated to keep this route standalone) ── */

function extractFileLinks(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const re = /https?:\/\/[^\s<>"')}\]]+/gi;
  for (const m of text.matchAll(re)) {
    const clean = m[0].replace(/[.,;]+$/, "");
    if (clean.length > 512) continue;
    if (seen.has(clean)) continue;
    seen.add(clean);
    out.push(clean);
  }
  return out;
}

/** Regex-safe escape for RegExp constructors (prevents ReDoS / crashes from
 *  subject names that contain `.`, `+`, `(`, etc.). */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mentionsSubject(text: string, subject: SubjectMeta): boolean {
  const t = text.slice(0, 3000);
  // Subject codes are always 4-digit numbers in this app.
  if (new RegExp(`\\b${escapeRegExp(subject.code)}\\b`).test(t)) return true;
  return (
    new RegExp(escapeRegExp(subject.shortName), "i").test(t) ||
    new RegExp(escapeRegExp(subject.name), "i").test(t)
  );
}

type Kind = "yearly" | "topical" | "notes" | "book";
const BOOK = /(textbook|coursebook|student'?s? ?book|book pdf|hodder|edition|cambridge book|cgp)/i;
const TOPICAL = /(topical|by ?topic|questions? ?by ?topic|per ?topic)/i;
const NOTES = /(notes|summary|summaries|revision notes|concise)/i;
const YEARLY =
  /(past ?paper|pastpaper|qp_|ms_|_s\d{2}_|_w\d{2}_|_m\d{2}_|question paper|mark scheme)/i;

function classifyPost(p: { title: string; selftext: string }): Kind {
  const text = `${p.title} ${p.selftext}`.slice(0, 4000);
  const scores: Record<Kind, number> = {
    topical: (text.match(TOPICAL) ?? []).length * 2,
    book: (text.match(BOOK) ?? []).length * 2,
    notes: (text.match(NOTES) ?? []).length * 2,
    yearly: (text.match(YEARLY) ?? []).length,
  };
  const best = (Object.keys(scores) as Kind[]).reduce((a, b) =>
    scores[b] > scores[a] ? b : a
  );
  return scores[best] === 0 ? "yearly" : best;
}
