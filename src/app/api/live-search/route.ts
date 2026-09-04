import { NextResponse } from "next/server";
import {
  classifyPost,
  extractFileLinks,
  redditConfigured,
  redditMissingHint,
  searchReddit,
  type RedditKindHint,
} from "@/lib/reddit";
import { cacheGet, cacheSet } from "@/lib/db";
import { getSubject } from "@/lib/subjects";
import type { SubjectMeta } from "@/lib/types";

export const dynamic = "force-dynamic";
const TTL_MS = 24 * 60 * 60 * 1000;

/**
 * GET /api/live-search?q=...&subject=9709
 * Searches Reddit right now (r/alevel + friends), caches results for 24h so
 * repeat queries don't burn the free-tier quota.
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") ?? "").trim();
  const subjectCode = sp.get("subject") ?? undefined;
  if (q.length < 3) {
    return NextResponse.json({ query: q, posts: [] });
  }
  if (!redditConfigured()) {
    return NextResponse.json(
      { error: "live-search-unavailable", message: redditMissingHint() },
      { status: 501 }
    );
  }

  const cacheKey = `live:${subjectCode ?? ""}:${q.toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached) {
    return NextResponse.json({
      query: q,
      cached: true,
      posts: JSON.parse(cached.resultsJson),
    });
  }

  const subject: SubjectMeta | undefined = subjectCode
    ? getSubject(subjectCode)
    : undefined;
  const hint: RedditKindHint = guessHint(q);
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
    type: RedditKindHint;
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
      type: classifyPost(p, hint),
      links: postLinks.slice(0, 8),
    });
  }

  cacheSet(cacheKey, JSON.stringify(results), TTL_MS);
  return NextResponse.json({ query: q, cached: false, posts: results });
}

function guessHint(q: string): RedditKindHint {
  const s = q.toLowerCase();
  if (/(topical|by ?topic)/.test(s)) return "topical";
  if (/(book|textbook|coursebook|edition)/.test(s)) return "book";
  if (/(notes|summary|revision)/.test(s)) return "notes";
  return "yearly";
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mentionsSubject(text: string, subject: SubjectMeta): boolean {
  const t = text.slice(0, 3000);
  if (new RegExp(`\\b${escapeRegExp(subject.code)}\\b`).test(t)) return true;
  return new RegExp(escapeRegExp(subject.shortName), "i").test(t) ||
    new RegExp(escapeRegExp(subject.name), "i").test(t);
}
