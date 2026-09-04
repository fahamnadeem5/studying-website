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

const SUGGESTIONS = [
  "9709 pure 1",
  "9702 paper 5",
  "9700 cell biology",
  "9618 algorithms",
  "9701 organic chemistry",
  "9231 further mechanics",
  "physics textbook",
  "topical questions integration",
];

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
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Autofocus the query input on first render
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

  const showSuggestions =
    !searched && !loading && q.trim().length < 2;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          marginBottom: "0.25rem",
        }}
      >
        Search
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
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
        <div style={{ position: "relative", minWidth: 240, flex: 1 }}>
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Try "9709 pure 1", "cell biology", "physics textbook"…'
            aria-label="Search query"
            style={{
              width: "100%",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              background: "var(--surface-elevated)",
              padding: "0.7rem 2.5rem 0.7rem 0.95rem",
              fontSize: "0.9rem",
              color: "var(--text)",
              outline: "none",
              boxShadow: "var(--shadow-sm)",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--brand)";
              e.currentTarget.style.boxShadow = "0 0 0 4px color-mix(in srgb, var(--brand) 15%, transparent)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.boxShadow = "var(--shadow-sm)";
            }}
          />
          {/* Loading spinner overlay */}
          {loading && (
            <span
              aria-hidden
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                width: 16,
                height: 16,
                border: "2px solid color-mix(in srgb, var(--brand) 30%, transparent)",
                borderTopColor: "var(--brand)",
                borderRadius: "50%",
                animation: "spinner 0.7s linear infinite",
              }}
            />
          )}
        </div>

        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          aria-label="Filter by subject"
          style={{
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            background: "var(--surface-elevated)",
            padding: "0.7rem 0.85rem",
            fontSize: "0.875rem",
            color: "var(--text)",
          }}
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
          style={{
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            background: "var(--surface-elevated)",
            padding: "0.7rem 0.85rem",
            fontSize: "0.875rem",
            color: "var(--text)",
          }}
        >
          <option value="">All types</option>
          <option value="yearly">Yearly papers</option>
          <option value="topical">Topical papers</option>
          <option value="notes">Notes</option>
          <option value="book">Books</option>
        </select>
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      <style>{`@keyframes spinner { to { transform: translateY(-50%) rotate(360deg); } }`}</style>

      <label
        className="mt-3 flex w-fit cursor-pointer items-center gap-2"
        style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
      >
        <input
          type="checkbox"
          checked={live}
          onChange={(e) => {
            setLive(e.target.checked);
            if (e.target.checked) void doLive();
          }}
          style={{ width: 16, height: 16, accentColor: "#ea580c" }}
        />
        <span style={{ fontWeight: 600, color: "#ea580c" }}>
          Include live Reddit results
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--text-faint)" }}>
          (queries r/alevel right now; cached 24h)
        </span>
      </label>

      {error && (
        <div
          className="card"
          style={{
            marginTop: "1rem",
            padding: "0.85rem 1rem",
            background: "color-mix(in srgb, #ef4444 10%, transparent)",
            border: "1px solid color-mix(in srgb, #ef4444 30%, transparent)",
            color: "#b91c1c",
            fontSize: "0.85rem",
          }}
        >
          {error}
        </div>
      )}
      {liveError && (
        <div
          className="card"
          style={{
            marginTop: "1rem",
            padding: "0.85rem 1rem",
            background: "color-mix(in srgb, #f59e0b 10%, transparent)",
            border: "1px solid color-mix(in srgb, #f59e0b 30%, transparent)",
            color: "#b45309",
            fontSize: "0.8rem",
            lineHeight: 1.5,
          }}
        >
          {liveError}
        </div>
      )}

      {/* ── Suggestions ── */}
      {showSuggestions && (
        <section style={{ marginTop: "2.5rem" }}>
          <h2
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--text-muted)",
              marginBottom: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Try a search
          </h2>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setQ(s)}
                className="badge"
                style={{
                  cursor: "pointer",
                  background: "var(--surface-muted)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  padding: "0.45rem 0.85rem",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Live Reddit ── */}
      {live && livePosts.length > 0 && (
        <section style={{ marginTop: "2.5rem" }}>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.75rem",
            }}
          >
            Live from Reddit
            <span
              className="badge"
              style={{
                background: "color-mix(in srgb, #ea580c 12%, transparent)",
                color: "#ea580c",
                border: "1px solid color-mix(in srgb, #ea580c 30%, transparent)",
              }}
            >
              {liveLoading ? "…" : `${livePosts.length}`}
            </span>
          </h2>
          <div className="space-y-2">
            {livePosts.map((p) => (
              <LiveRow key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── Results ── */}
      <section style={{ marginTop: "2.5rem" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.75rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            Results
            {loading && (
              <span
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                }}
              >
                searching…
              </span>
            )}
          </h2>
          {!loading && searched && (
            <span style={{ color: "var(--text-faint)", fontSize: "0.75rem" }}>
              {rows.length} for &ldquo;{searched}&rdquo;
            </span>
          )}
        </div>
        {countsBySource.size > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5" style={{ fontSize: "0.7rem" }}>
            {[...countsBySource.entries()].map(([s, n]) => (
              <span
                key={s}
                className="badge"
                style={{
                  background: "var(--surface-muted)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                }}
              >
                {SITES[s]?.label ?? s}: {n}
              </span>
            ))}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div style={{ marginTop: "1rem" }} className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: 64, borderRadius: "var(--radius-lg)" }}
              />
            ))}
          </div>
        )}

        <div style={{ marginTop: "1rem" }} className="space-y-2">
          {!loading && !searched && !error && (
            <div
              style={{
                borderRadius: "var(--radius-lg)",
                border: "1px dashed var(--border)",
                padding: "2.5rem",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "color-mix(in srgb, var(--brand) 12%, transparent)",
                  color: "var(--brand)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 0.75rem",
                  fontSize: "1.5rem",
                  fontWeight: 800,
                }}
              >
                ?
              </div>
              <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: "0.25rem" }}>
                Start typing to search
              </div>
              <div style={{ fontSize: "0.85rem" }}>
                Or pick a suggestion above to see how search works.
              </div>
            </div>
          )}
          {!loading && searched && rows.length === 0 && (
            <div
              style={{
                borderRadius: "var(--radius-lg)",
                border: "1px dashed var(--border)",
                padding: "2.5rem",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "var(--text)",
                  marginBottom: "0.5rem",
                }}
              >
                No results for &ldquo;{searched}&rdquo;
              </div>
              <div style={{ fontSize: "0.9rem" }}>
                Try a different wording, broaden the subject filter, or
                toggle the live Reddit search above for fresh links.
              </div>
            </div>
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
    <div
      className="card"
      style={{
        padding: "0.9rem 1rem",
        border: "1px solid color-mix(in srgb, #ea580c 30%, var(--border))",
        background: "color-mix(in srgb, #ea580c 4%, var(--surface-elevated))",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
        <span
          style={{
            width: 24,
            height: 24,
            flexShrink: 0,
            borderRadius: 6,
            background: "#ea580c",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.7rem",
            fontWeight: 800,
            marginTop: 2,
          }}
        >
          R
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: "0.9rem", fontWeight: 600, lineHeight: 1.4, color: "var(--text)" }}>
            {post.title}
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "0.75rem",
              marginTop: "0.35rem",
              fontSize: "0.7rem",
              color: "var(--text-faint)",
            }}
          >
            <span>
              r/{post.subreddit} · u/{post.author} · ⬆ {post.score}
            </span>
            {post.links.length > 1 && <span>{post.links.length} files</span>}
            <a
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#ea580c", textDecoration: "none" }}
              className="hover:underline"
            >
              discussion ↗
            </a>
          </div>
          <div style={{ marginTop: "0.6rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {post.links.slice(0, 4).map((l, i) => (
              <a
                key={i}
                href={l}
                target="_blank"
                rel="noopener noreferrer"
                className="badge"
                style={{
                  background: "color-mix(in srgb, #ea580c 8%, var(--surface-muted))",
                  color: "#ea580c",
                  border: "1px solid color-mix(in srgb, #ea580c 25%, var(--border))",
                  textDecoration: "none",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                }}
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
