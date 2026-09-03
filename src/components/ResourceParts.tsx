import type { ReactNode } from "react";
import { SITES } from "@/lib/sites";
import type { ResourceRow, SubjectMeta } from "@/lib/types";
import { relativeTime } from "@/lib/format";
import { sessionDisplay } from "@/lib/format";

export function tint(hex: string, alpha: string): string {
  return hex + alpha;
}

export function KindBadge({ kind }: { kind: ResourceRow["kind"] }) {
  const map: Record<string, { label: string; cls: string }> = {
    qp: { label: "QP", cls: "bg-blue-600 text-white" },
    ms: { label: "MS", cls: "bg-emerald-600 text-white" },
    gt: { label: "GT", cls: "bg-amber-600 text-white" },
    in: { label: "Insert", cls: "bg-violet-600 text-white" },
    er: { label: "ER", cls: "bg-rose-600 text-white" },
    syllabus: { label: "Syllabus", cls: "bg-slate-600 text-white" },
    other: { label: "", cls: "" },
  };
  const m = map[kind] ?? map.other;
  if (!m.label) return null;
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-bold leading-none ${m.cls}`}
      title={
        kind === "qp"
          ? "Question paper"
          : kind === "ms"
            ? "Mark scheme"
            : kind === "gt"
              ? "Grade thresholds"
              : undefined
      }
    >
      {m.label}
    </span>
  );
}

export function SessionBadge({ row }: { row: ResourceRow }) {
  const label = sessionDisplay(row.session, row.year);
  if (label === "—") return null;
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
      {label}
    </span>
  );
}

export function SourceChip({ source }: { source: string }) {
  const s = SITES[source] ?? { label: source };
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
      <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
      {s.label}
    </span>
  );
}

export function MetaDot({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500"
    >
      {children}
    </span>
  );
}

export function UpdatedNote({ row }: { row: ResourceRow }) {
  return (
    <MetaDot title={row.last_verified}>verified {relativeTime(row.last_verified)}</MetaDot>
  );
}

export function TypeIcon({ type }: { type: ResourceRow["type"] }) {
  const icons: Record<string, string> = {
    yearly: "📄",
    topical: "🧩",
    notes: "📝",
    book: "📚",
  };
  return <span aria-hidden>{icons[type] ?? "🔗"}</span>;
}

/** Count pill used on section headers/cards. */
export function CountPill({ n, color }: { n: number; color?: string }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-semibold"
      style={
        color
          ? { backgroundColor: tint(color, "22"), color }
          : undefined
      }
    >
      {n.toLocaleString()}
    </span>
  );
}

export function subjectHex(s: SubjectMeta | undefined): string {
  return s?.color ?? "#71717a";
}
