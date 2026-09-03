/** Shared domain types for the A-Level resource hub. */

export type ResourceType = "yearly" | "topical" | "notes" | "book";
export type PaperKind =
  | "qp"
  | "ms"
  | "gt"
  | "in"
  | "er"
  | "syllabus"
  | "other";

/** CAIE exam series. m = Feb/March, s = May/June, w = Oct/Nov. */
export type SessionLetter = "m" | "s" | "w";

export interface SubjectMeta {
  code: string; // 9709 etc.
  name: string; // "Mathematics"
  shortName: string; // "Maths"
  level: string; // "AS & A Level"
  /** accent color used on the site (tailwind-ish hex) */
  color: string;
  /** slug used by pastpapers.papacambridge.com subject pages */
  papacambridgeSlug: string;
  /** path segment used by notes.papacambridge.com */
  notesSlug: string;
  /** URL path on physicsandmathstutor.com, if PMT covers CAIE for it */
  pmtPath?: string;
}

export interface ResourceRow {
  id: number;
  subject_code: string;
  type: ResourceType;
  title: string;
  year: number | null;
  session: SessionLetter | null;
  paper: string | null; // e.g. "Paper 1", "P2"
  variant: number | null;
  kind: PaperKind;
  topic: string | null;
  source: string;
  url: string;
  description: string | null;
  metadata: string | null;
  first_seen: string;
  last_verified: string;
}

export interface NewResource {
  subjectCode: string;
  type: ResourceType;
  title: string;
  url: string;
  source: string;
  kind?: PaperKind;
  year?: number | null;
  session?: SessionLetter | null;
  paper?: string | null;
  variant?: number | null;
  topic?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface SubjectCounts {
  yearly: number;
  topical: number;
  notes: number;
  book: number;
  total: number;
}

export const SESSION_NAMES: Record<SessionLetter, string> = {
  m: "Feb/March",
  s: "May/June",
  w: "Oct/Nov",
};

export const SESSION_LETTERS: SessionLetter[] = ["m", "s", "w"];

export const RESOURCE_TYPES: ResourceType[] = [
  "yearly",
  "topical",
  "notes",
  "book",
];

export const TYPE_LABELS: Record<ResourceType, string> = {
  yearly: "Yearly Past Papers",
  topical: "Topical Past Papers",
  notes: "Notes",
  book: "Books",
};

export const KIND_LABELS: Record<PaperKind, string> = {
  qp: "Question Paper",
  ms: "Mark Scheme",
  gt: "Grade Thresholds",
  in: "Insert",
  er: "Examiner Report",
  syllabus: "Syllabus",
  other: "Other",
};
