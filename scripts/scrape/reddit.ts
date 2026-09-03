/**
 * Batch Reddit scraper — surfaces shared files (Drive/Mega/PDF links) for
 * yearly, topical, notes and books across r/alevel and friends.
 *
 * Requires REDDIT_CLIENT_ID/REDDIT_CLIENT_SECRET (see src/lib/reddit.ts).
 * Skips quietly when unconfigured.
 */

import {
  classifyPost,
  extractFileLinks,
  redditConfigured,
  searchReddit,
  type RedditKindHint,
  type RedditPost,
} from "../../src/lib/reddit";
import { upsertResource } from "../../src/lib/db";
import { SUBJECTS } from "../../src/lib/subjects";
import { sleep } from "./common";
import type { SubjectMeta } from "../../src/lib/types";

export const REDDIT_SOURCE = "reddit";

const SUBREDDITS = ["alevel", "6thForm", "IGCSE"];

const QUERIES: Record<RedditKindHint, (s: SubjectMeta) => string[]> = {
  yearly: (s) => [
    `${s.code} ${s.name} past papers`,
    `A level ${s.shortName} ${s.code} recent past papers`,
  ],
  topical: (s) => [
    `${s.code} topical past papers`,
    `A level ${s.shortName} ${s.code} questions by topic`,
  ],
  notes: (s) => [
    `${s.code} ${s.shortName} notes pdf`,
    `A level ${s.shortName} ${s.code} revision notes`,
    `${s.code} znotes summary`,
  ],
  book: (s) => [
    `${s.code} textbook pdf`,
    `A level ${s.shortName} coursebook pdf`,
    `${s.shortName} ${s.code} student book drive`,
  ],
};

export async function scrapeReddit(opts: {
  codes?: string[];
  sections?: RedditKindHint[];
  perQuery?: number;
  log?: (m: string) => void;
}): Promise<number> {
  const log = opts.log ?? (() => {});
  if (!redditConfigured()) {
    log(
      "  [reddit] skipped — REDDIT_CLIENT_ID/REDDIT_CLIENT_SECRET not set " +
        "(optional; see README)"
    );
    return 0;
  }
  const allCodes = SUBJECTS.map((s) => s.code);
  const codes =
    opts.codes && opts.codes.length > 0 ? opts.codes : allCodes;
  const sections = opts.sections ?? ["yearly", "topical", "notes", "book"];
  const limit = opts.perQuery ?? 12;
  let found = 0;

  for (const sub of SUBJECTS) {
    if (!codes.includes(sub.code)) continue;
    for (const section of sections) {
      for (const q of QUERIES[section](sub)) {
        const posts = await searchSubreddits(q, sub, section, limit, log);
        for (const p of posts) {
          found += indexPost(p, sub, section);
        }
        await sleep(2200); // stay well under Reddit's 100 QPM free tier
      }
    }
  }
  return found;
}

async function searchSubreddits(
  query: string,
  subject: SubjectMeta,
  section: RedditKindHint,
  limit: number,
  log: (m: string) => void
): Promise<RedditPost[]> {
  const posts: RedditPost[] = [];
  for (const subreddit of SUBREDDITS) {
    try {
      const hits = await searchReddit(query, {
        subreddit,
        sort: "relevance",
        limit,
      });
      const relevant = hits.filter((p) => postLooksRelevant(p, subject));
      if (relevant.length) {
        log(
          `  [reddit] ${subject.code} ${section} "${query}" → r/${subreddit}: ${relevant.length}`
        );
      }
      posts.push(...relevant);
    } catch (err) {
      log(
        `  [reddit] query failed "${query}" on r/${subreddit}: ${
          (err as Error).message
        }`
      );
    }
  }
  return posts;
}

/** Keep posts that mention the subject code/name or clearly match the section. */
function postLooksRelevant(
  p: RedditPost,
  subject: SubjectMeta
): boolean {
  const text = `${p.title} ${p.selftext}`.slice(0, 2000);
  const codeHit = new RegExp(`\\b${subject.code}\\b`).test(text);
  if (!codeHit) {
    const nameHit = new RegExp(
      `${subject.shortName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
      "i"
    ).test(text);
    if (!nameHit) return false;
  }
  if (p.over18) return false;
  // needs at least one file-ish link somewhere
  return (
    extractFileLinks(`${p.title}\n${p.selftext}\n${p.url}`).length > 0 ||
    looksLikeFileUrl(p.url)
  );
}

function looksLikeFileUrl(u: string): boolean {
  return /\.pdf$|\.zip$/i.test(u) ||
    /drive\.google\.com|mega\.nz|mediafire|dropbox|archive\.org/i.test(u);
}

function indexPost(
  p: RedditPost,
  subject: SubjectMeta,
  hint: RedditKindHint
): number {
  const text = `${p.title}\n${p.selftext}`;
  const links = extractFileLinks(text);
  const kind = classifyPost(p, hint);
  const meta = {
    postTitle: p.title,
    redditPermalink: `https://www.reddit.com${p.permalink}`,
    subreddit: p.subreddit,
    author: p.author,
    score: p.score,
    numComments: p.numComments,
    createdUtc: p.createdUtc,
  };

  // If the post itself is a direct file link but selftext has none, use it.
  const all = links.length > 0 ? links : looksLikeFileUrl(p.url) ? [p.url] : [];

  let count = 0;
  for (const url of all.slice(0, 6)) {
    upsertResource({
      subjectCode: subject.code,
      type: kind,
      title: cleanPostTitle(p.title, url),
      url,
      source: REDDIT_SOURCE,
      description: "Shared on Reddit (r/" + p.subreddit + ")",
      metadata: meta,
    });
    count += 1;
  }
  return count;
}

function cleanPostTitle(title: string, url: string): string {
  let t = title.trim().slice(0, 200);
  if (/drive\.google\.com\/drive\/folders/.test(url)) t += " (folder)";
  return t;
}
