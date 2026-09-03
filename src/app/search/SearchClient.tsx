"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ResourceRow } from "@/lib/types";
import { ResourceRowView } from "@/components/ResourceRowView";
import { SITES } from "@/lib/sites";

interface LivePost {
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
}

interface SubjectOption {
  code: string;
  name: string;
}

export function SearchClient({
  initialQuery,
  initialSubject,
  subjects,
}: {
  initialQuery: string;
  initialSubject: string;
  subjects: SubjectOption[];
}) {
  const [q, setQ] = useState(initialQuery);
  const [subject, setSubject] = useState(initialSubject);
  const [type, setType] = useState("");
  const [live, setLive] = useState(false);
  const [rows, setRows] = useState<ResourceRow[]>([]);
  const [livePosts, setLivePosts] = useState<LivePost[]>([]);
  const [loading, setLoading] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [searched, setSearched] = useState("");

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function runSearch(query: string) {
    const needle = query.trim();
    if (needle.length < 2) {
      setRows([]);
      setSearched("");
      return;
    }
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ q: needle });
    if (subject) params.set("subject", subject);
    if (type) params.set("type", type);
    fetch(`/api/search?${params}`)
      .then((r) => r.json())
      .then((d: { resources?: ResourceRow[]; error?: string }) => {
        if (d.error) setError(d.error);
        else {
          setRows(d.resources ?? []);
          setSearched(needle);
        }
      })
      .catch(() => setError("Search failed. Is the dev server running?"))
      .finally(() => setLoading(false));
  }

  // initial search if the page was opened with ?q= (deferred so the effect
  // body doesn't call setState synchronously)
  useEffect(() => {
    if (!initialQuery.trim()) return;
    const t = setTimeout(() => runSearch(initialQuery), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => runSearch(q), 260);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, subject, type]);

  // live search only fires on explicit toggle + submit
  async function doLive() {
    const needle = q.trim();
    if (needle.length < 3) return;
    setLiveLoading(true);
    setLiveError(null);
    const params = new URLSearchParams({ q: needle });
    if (subject) params.set("subject", subject);
    try {
      const r = await fetch(`/api/live-search?${params}`);
      const d = (await r.json()) as {
        posts?: LivePost[];
        error?: string;
        message?: string;
      };
      if (!r.ok) {
        if (d.error === "live-search-unavailable") {
          setLiveError(
            "Live search needs Reddit API keys. " +
              (d.message ?? "See README.")
          );
        } else {
          setLiveError(d.error ?? "Live search failed");
        }
        return;
      }
      setLivePosts(d.posts ?? []);
    } catch {
      setLiveError("Live search failed");
    } finally {
      setLiveLoading(false);
    }
  }

  const countsBySource = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.source, (m.get(r.source) ?? 0) + 1);
    return m;
  }, [rows]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">Search</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Instant search across the indexed catalog — or hit Reddit live for the
        freshest shared files.
      </p>

      <form
        className="mt-5 flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(q);
        }}
      >
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='Try "9709 pure 1", "cell biology", "physics textbook"…'
          aria-label="Search query"
          className="min-w-[240px] flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          aria-label="Filter by subject"
          className="rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s.code} value={s.code}>
              {s.code} {s.name}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Filter by type"
          className="rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">All types</option>
          <option value="yearly">Yearly papers</option>
          <option value="topical">Topical papers</option>
          <option value="notes">Notes</option>
          <option value="book">Books</option>
        </select>
        <button
          type="submit"
          className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Search
        </button>
      </form>

      <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={live}
          onChange={(e) => {
            setLive(e.target.checked);
            if (e.target.checked) void doLive();
          }}
          className="h-4 w-4 accent-orange-500"
        />
        <span className="font-medium text-orange-600 dark:text-orange-400">
          Include live Reddit results
        </span>
        <span className="text-xs text-zinc-400">
          (queries r/alevel right now; cached 24h)
        </span>
      </label>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      {liveError && (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          {liveError}
        </p>
      )}

      {live && livePosts.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            Live from Reddit
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-700 dark:bg-orange-950 dark:text-orange-300">
              {liveLoading ? "…" : `${livePosts.length}`}
            </span>
          </h2>
          <div className="mt-3 space-y-2">
            {livePosts.map((p) => (
              <LiveRow key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="flex items-center gap-2 text-lg font-bold">Results</h2>
          {loading && (
            <span className="text-xs text-zinc-400">searching…</span>
          )}
          {!loading && searched && (
            <span className="text-xs text-zinc-400">
              {rows.length} for “{searched}”
            </span>
          )}
        </div>
        {countsBySource.size > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
            {[...countsBySource.entries()].map(([s, n]) => (
              <span
                key={s}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              >
                {SITES[s]?.label ?? s}: {n}
              </span>
            ))}
          </div>
        )}
        <div className="mt-3 space-y-2">
          {!loading && !searched && !error && (
            <p className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500">
              Type a query to search {rows ? "" : ""}the catalog.
            </p>
          )}
          {!loading && searched && rows.length === 0 && (
            <p className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500">
              No indexed results for “{searched}”. Try the live Reddit toggle
              above, or a different wording.
            </p>
          )}
          {rows.map((r) => (
            <ResourceRowView key={r.id} row={r} />
          ))}
        </div>
      </section>
    </div>
  );
}

function LiveRow({ post }: { post: LivePost }) {
  return (
    <div className="rounded-lg border border-orange-200/70 bg-orange-50/50 p-3 dark:border-orange-900/60 dark:bg-orange-950/20">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-orange-500 text-[10px] font-bold text-white">
          R
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-100">
            {post.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
            <span>
              r/{post.subreddit} · u/{post.author} · ⬆ {post.score}
            </span>
            {post.links.length > 1 && (
              <span>{post.links.length} files</span>
            )}
            <a
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline dark:text-orange-400"
            >
              discussion ↗
            </a>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {post.links.slice(0, 4).map((l, i) => (
              <a
                key={i}
                href={l}
                target="_blank"
                rel="noopener noreferrer"
                className="max-w-full truncate rounded-md border border-orange-300/60 px-2 py-1 text-[11px] text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-900/40"
              >
                Open file {post.links.length > 1 ? `${i + 1}` : ""} ↗
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
