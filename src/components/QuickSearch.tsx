"use client";

import { useMemo, useState } from "react";
import { ResourceRowView } from "./ResourceRowView";
import type { ResourceRow } from "@/lib/types";

/** Client-side substring filter over an already-fetched list of rows. */
export function QuickSearch({
  rows,
  accent,
  placeholder = "Filter this list…",
}: {
  rows: ResourceRow[];
  accent?: string;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(needle) ||
        (r.topic?.toLowerCase().includes(needle) ?? false) ||
        (r.description?.toLowerCase().includes(needle) ?? false) ||
        r.source.includes(needle)
    );
  }, [q, rows]);

  return (
    <div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label="Filter list"
        className="w-full max-w-sm rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <p className="mt-2 text-xs text-zinc-400">
        {filtered.length} of {rows.length} shown
      </p>
      <div className="mt-3 space-y-2">
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
            Nothing matches “{q}”.
          </p>
        ) : (
          filtered.map((r) => (
            <ResourceRowView key={r.id} row={r} accent={accent} />
          ))
        )}
      </div>
    </div>
  );
}
