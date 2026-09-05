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
      <div style={{ position: "relative", maxWidth: 380 }}>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          aria-label="Filter list"
          style={{
            width: "100%",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            background: "var(--surface-elevated)",
            padding: "0.55rem 0.85rem 0.55rem 2.2rem",
            fontSize: "0.85rem",
            color: "var(--text)",
            outline: "none",
            boxShadow: "var(--shadow-sm)",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = accent ?? "var(--brand)";
            e.currentTarget.style.boxShadow = `0 0 0 4px color-mix(in srgb, ${accent ?? "var(--brand)"} 15%, transparent)`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.boxShadow = "var(--shadow-sm)";
          }}
        />
        <svg
          aria-hidden
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-faint)",
            pointerEvents: "none",
          }}
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      <p
        style={{
          marginTop: "0.5rem",
          fontSize: "0.7rem",
          color: "var(--text-faint)",
        }}
      >
        <strong style={{ color: "var(--text-muted)" }}>
          {filtered.length.toLocaleString()}
        </strong>{" "}
        of {rows.length.toLocaleString()} shown
      </p>
      <div style={{ marginTop: "0.75rem" }} className="space-y-2">
        {filtered.length === 0 ? (
          <p
            style={{
              borderRadius: "var(--radius-lg)",
              border: "1px dashed var(--border)",
              padding: "2rem",
              textAlign: "center",
              fontSize: "0.85rem",
              color: "var(--text-muted)",
            }}
          >
            Nothing matches &ldquo;{q}&rdquo;.
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
