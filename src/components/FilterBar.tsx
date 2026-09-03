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

  const selectCls =
    "rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-700 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-xs font-medium text-zinc-500" htmlFor="f-year">
        Year
      </label>
      <select
        id="f-year"
        className={selectCls}
        value={current.year}
        onChange={(e) => set("year", e.target.value)}
      >
        <option value="">All</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      <label className="text-xs font-medium text-zinc-500" htmlFor="f-session">
        Session
      </label>
      <select
        id="f-session"
        className={selectCls}
        value={current.session}
        onChange={(e) => set("session", e.target.value)}
      >
        <option value="">All</option>
        {sessions.map((s) => (
          <option key={s} value={s}>
            {SESSION_NAMES[s]}
          </option>
        ))}
      </select>

      {kinds.length > 0 && (
        <>
          <label className="text-xs font-medium text-zinc-500" htmlFor="f-kind">
            Type
          </label>
          <select
            id="f-kind"
            className={selectCls}
            value={current.kind}
            onChange={(e) => set("kind", e.target.value)}
          >
            <option value="">All</option>
            {kinds.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </>
      )}

      {sources.length > 1 && (
        <>
          <label className="text-xs font-medium text-zinc-500" htmlFor="f-source">
            Source
          </label>
          <select
            id="f-source"
            className={selectCls}
            value={current.source}
            onChange={(e) => set("source", e.target.value)}
          >
            <option value="">All</option>
            {sources.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </>
      )}

      {(current.year || current.session || current.kind || current.source) && (
        <button
          type="button"
          onClick={() => router.push(base, { scroll: false })}
          className="rounded-lg px-2.5 py-1.5 text-sm font-medium"
          style={{ color }}
        >
          ✕ Clear
        </button>
      )}
    </div>
  );
}
