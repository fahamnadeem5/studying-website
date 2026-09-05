"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { ResourceRow, SubjectMeta } from "@/lib/types";
import { SITES } from "@/lib/sites";
import { relativeTime, sessionDisplay } from "@/lib/format";

export function tint(hex: string, alpha: string): string {
  return hex + alpha;
}

/* ─── Kind badge ─────────────────────────────────────────────────── */

const KIND_META: Record<
  string,
  { label: string; full: string; css: string; dark: string }
> = {
  qp: {
    label: "QP",
    full: "Question paper",
    css: "background: var(--kind-qp); color: white;",
    dark: "background: color-mix(in srgb, var(--kind-qp) 85%, white); color: white;",
  },
  ms: {
    label: "MS",
    full: "Mark scheme",
    css: "background: var(--kind-ms); color: white;",
    dark: "background: color-mix(in srgb, var(--kind-ms) 85%, white); color: white;",
  },
  gt: {
    label: "GT",
    full: "Grade thresholds",
    css: "background: var(--kind-gt); color: white;",
    dark: "background: color-mix(in srgb, var(--kind-gt) 85%, white); color: white;",
  },
  in: {
    label: "Ins",
    full: "Insert",
    css: "background: var(--kind-in); color: white;",
    dark: "background: color-mix(in srgb, var(--kind-in) 85%, white); color: white;",
  },
  er: {
    label: "ER",
    full: "Examiner report",
    css: "background: var(--kind-er); color: white;",
    dark: "background: color-mix(in srgb, var(--kind-er) 85%, white); color: white;",
  },
  syllabus: {
    label: "Syll",
    full: "Syllabus",
    css: "background: var(--kind-syllabus); color: white;",
    dark: "background: color-mix(in srgb, var(--kind-syllabus) 85%, white); color: white;",
  },
};

export function KindBadge({ kind }: { kind: ResourceRow["kind"] }) {
  const m = KIND_META[kind];
  if (!m) return null;
  return (
    <span
      title={m.full}
      className="kind-badge"
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "0.25rem",
        padding: "0.125rem 0.4rem",
        fontSize: "0.65rem",
        fontWeight: 800,
        letterSpacing: "0.04em",
        lineHeight: 1.4,
        ...parseStyle(m.css),
      }}
    >
      {m.label}
    </span>
  );
}

function parseStyle(s: string): React.CSSProperties {
  const out: Record<string, string> = {};
  for (const decl of s.split(";")) {
    const [k, v] = decl.split(":").map((x) => x && x.trim());
    if (k && v) {
      // convert "background" -> "background" already camelCase; "background-color" -> "backgroundColor"
      const camel = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      out[camel] = v;
    }
  }
  return out as React.CSSProperties;
}

/* ─── Session / source / updated ─────────────────────────────────── */

export function SessionBadge({ row }: { row: ResourceRow }) {
  const label = sessionDisplay(row.session, row.year);
  if (label === "—") return null;
  return (
    <span
      className="badge"
      style={{
        background: "var(--surface-muted)",
        color: "var(--text-muted)",
        border: "1px solid var(--border)",
        fontSize: "0.7rem",
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

const SOURCE_COLOR: Record<string, string> = {
  papacambridge: "#2563eb",
  "notes-papacambridge": "#0ea5e9",
  pmt: "#d97706",
  reddit: "#ea580c",
};

export function SourceChip({ source }: { source: string }) {
  const s = SITES[source] ?? { label: source };
  const dot = SOURCE_COLOR[source] ?? "var(--text-faint)";
  return (
    <span
      className="badge"
      style={{
        background: "var(--surface)",
        color: "var(--text-muted)",
        border: "1px solid var(--border)",
        fontSize: "0.7rem",
        fontWeight: 500,
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: dot,
          flexShrink: 0,
        }}
      />
      {s.label}
    </span>
  );
}

export function MetaDot({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        fontSize: "0.7rem",
        color: "var(--text-faint)",
      }}
    >
      {children}
    </span>
  );
}

export function UpdatedNote({ row }: { row: ResourceRow }) {
  return (
    <MetaDot title={row.last_verified}>
      <span aria-hidden>•</span> verified {relativeTime(row.last_verified)}
    </MetaDot>
  );
}

/* ─── Type icon (inline SVG) ─────────────────────────────────────── */

export function TypeIcon({
  type,
  className,
  style,
}: {
  type: ResourceRow["type"];
  className?: string;
  style?: React.CSSProperties;
}) {
  const stroke = "currentColor";
  const svgProps = { "aria-hidden": true, width: 14, height: 14, viewBox: "0 0 24 24", fill: "none" as const, stroke, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className, style };
  switch (type) {
    case "yearly":
      return (
        <svg {...svgProps}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8M8 17h5" />
        </svg>
      );
    case "topical":
      return (
        <svg {...svgProps}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "notes":
      return (
        <svg {...svgProps}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" />
        </svg>
      );
    case "book":
      return (
        <svg {...svgProps}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
  }
}

/* ─── Count pill ─────────────────────────────────────────────────── */

export function CountPill({ n, color }: { n: number; color?: string }) {
  return (
    <span
      style={{
        borderRadius: "9999px",
        padding: "0.15rem 0.6rem",
        fontSize: "0.7rem",
        fontWeight: 700,
        background: color ? tint(color, "22") : "var(--surface-muted)",
        color: color ?? "var(--text-muted)",
      }}
    >
      {n.toLocaleString()}
    </span>
  );
}

/* ─── Copy-link button (client-only state) ───────────────────────── */

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
        } catch {
          // ignore — clipboard may be blocked
        }
      }}
      aria-label={copied ? "Link copied" : "Copy link"}
      title={copied ? "Copied" : "Copy link"}
      className="btn btn-ghost"
      style={{
        padding: "0.4rem",
        width: 30,
        height: 30,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: copied ? "var(--brand)" : "var(--text-muted)",
      }}
    >
      {copied ? (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

/* ─── Subject hex helper ─────────────────────────────────────────── */

export function subjectHex(s: SubjectMeta | undefined): string {
  return s?.color ?? "#71717a";
}
