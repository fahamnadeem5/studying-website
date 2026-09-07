"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SESSION_NAMES } from "@/lib/types";

interface FilterOption {
  value: string;
  label: string;
}

interface Props {
  base: string;
  years: number[];
  sessions: Array<"m" | "s" | "w">;
  kinds: FilterOption[];
  sources: FilterOption[];
  color: string;
}

const selectBaseStyle: React.CSSProperties = {
  borderRadius: "var(--radius)",
  border: "1px solid var(--border)",
  background: "var(--surface-elevated)",
  padding: "0.45rem 0.7rem",
  fontSize: "0.8rem",
  color: "var(--text)",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

export function FilterBar({ base, years, sessions, kinds, sources, color }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  const current = {
    year: sp.get("year") ?? "",
    session: sp.get("session") ?? "",
    kind: sp.get("kind") ?? "",
    source: sp.get("source") ?? "",
  };

  function set(key: keyof typeof current, value: string) {
    const next = new URLSearchParams();
    for (const k of Object.keys(current) as Array<keyof typeof current>) {
      const v = k === key ? value : current[k];
      if (v) next.set(k, v);
    }
    const qs = next.toString();
    router.push(qs ? `${base}?${qs}` : base, { scroll: false });
  }

  const hasAnyFilter = Boolean(
    current.year || current.session || current.kind || current.source
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        padding: "0.85rem 1rem",
        borderRadius: "var(--radius-lg)",
        background: "var(--surface-muted)",
        border: "1px solid var(--border)",
      }}
    >
      {years.length > 0 && (
        <ChipGroup
          label="Year"
          options={[{ value: "", label: "All" }, ...years.map((y) => ({ value: String(y), label: String(y) }))]}
          value={current.year}
          onChange={(v) => set("year", v)}
          color={color}
        />
      )}
      {sessions.length > 0 && (
        <ChipGroup
          label="Session"
          options={[
            { value: "", label: "All" },
            ...sessions.map((s) => ({ value: s, label: SESSION_NAMES[s] })),
          ]}
          value={current.session}
          onChange={(v) => set("session", v)}
          color={color}
        />
      )}
      {kinds.length > 0 && (
        <ChipGroup
          label="Type"
          options={[{ value: "", label: "All" }, ...kinds]}
          value={current.kind}
          onChange={(v) => set("kind", v)}
          color={color}
        />
      )}

      {sources.length > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            flexWrap: "wrap",
          }}
        >
          <label
            htmlFor="f-source"
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              minWidth: 56,
            }}
          >
            Source
          </label>
          <select
            id="f-source"
            value={current.source}
            onChange={(e) => set("source", e.target.value)}
            aria-label="Filter by source"
            style={selectBaseStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = color;
              e.currentTarget.style.boxShadow = `0 0 0 3px color-mix(in srgb, ${color} 18%, transparent)`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <option value="">All</option>
            {sources.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {hasAnyFilter && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => router.push(base, { scroll: false })}
            className="btn btn-ghost"
            aria-label="Clear all filters"
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: color,
              padding: "0.35rem 0.7rem",
              minHeight: 36,
            }}
          >
            ✕ Clear all
          </button>
        </div>
      )}
    </div>
  );
}

function ChipGroup({
  label,
  options,
  value,
  onChange,
  color,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          minWidth: 56,
        }}
      >
        {label}
      </span>
      <div
        role="radiogroup"
        aria-label={label}
        style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}
      >
        {options.map((o) => {
          const active = (value || "") === o.value;
          return (
            <button
              key={o.value || "all"}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.value)}
              style={{
                padding: "0.45rem 0.85rem",
                borderRadius: "9999px",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s var(--ease-out-quint)",
                border: `1px solid ${active ? color : "var(--border)"}`,
                background: active
                  ? `color-mix(in srgb, ${color} 14%, var(--surface))`
                  : "var(--surface-elevated)",
                color: active ? color : "var(--text-muted)",
                minHeight: 36,
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.borderColor = `color-mix(in srgb, ${color} 50%, var(--border))`;
                  e.currentTarget.style.color = "var(--text)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--text-muted)";
                }
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
