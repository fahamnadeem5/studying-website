import { SESSION_NAMES } from "./types";
import type { PaperKind, SessionLetter } from "./types";

export interface ParsedCieFile {
  subjectCode: string;
  session: SessionLetter;
  year: number;
  kind: PaperKind;
  component: string | null;
}

/**
 * Parse a CAIE filename like `9709_s24_qp_12.pdf` or `9709_w19_gt.pdf`.
 * Returns null for non-CAIE names or one-digit-era components.
 */
export function parseCieFile(name: string): ParsedCieFile | null {
  const m = /^(\d{4})_([msw])(\d{2})_([a-z]+?)(?:_(\d{2}))?\.pdf$/i.exec(
    name.trim()
  );
  if (!m) return null;
  const kinds: Record<string, PaperKind> = {
    qp: "qp",
    ms: "ms",
    gt: "gt",
    in: "in",
    er: "er",
    syllabus: "syllabus",
  };
  const kind = kinds[m[4].toLowerCase()] ?? "other";
  return {
    subjectCode: m[1],
    session: m[2].toLowerCase() as SessionLetter,
    year: 2000 + Number(m[3]),
    kind,
    component: m[5] ?? null,
  };
}

export function componentLabel(component: string): string {
  const digit = component[0];
  const paperMap: Record<string, string> = {
    "1": "Paper 1",
    "2": "Paper 2",
    "3": "Paper 3",
    "4": "Paper 4",
    "5": "Paper 5",
    "6": "Paper 6",
    "7": "Paper 7",
    "8": "Paper 8",
  };
  const base = paperMap[digit] ?? `Paper ${digit}`;
  const variant = Number(component[1]);
  if (variant > 1) return `${base} (Variant ${variant})`;
  return base;
}

const KIND_SUFFIX: Record<PaperKind, string> = {
  qp: "",
  ms: " Mark Scheme",
  gt: " Grade Thresholds",
  in: " Insert",
  er: " Examiner Report",
  syllabus: " Syllabus",
  other: "",
};

/** e.g. "Physics May/June 2024 Paper 1 (Variant 2) Mark Scheme" */
export function yearlyPaperTitle(
  subjectName: string,
  session: SessionLetter,
  year: number,
  component: string | null,
  kind: PaperKind
): string {
  const bits = [subjectName, SESSION_NAMES[session], String(year)];
  if (component) bits.push(componentLabel(component));
  return bits.join(" ") + KIND_SUFFIX[kind];
}

export function sessionDisplay(
  session: SessionLetter | null,
  year: number | null
): string {
  if (year && session) return `${SESSION_NAMES[session]} ${year}`;
  if (year) return String(year);
  if (session) return SESSION_NAMES[session];
  return "—";
}

/** Best-effort ISO date from SQLite datetime('now') strings. */
export function relativeTime(sqliteDate: string): string {
  const t = new Date(sqliteDate.replace(" ", "T") + "Z").getTime();
  if (!t) return "";
  const diff = Date.now() - t;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(t).toISOString().slice(0, 10);
}
