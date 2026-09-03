import type { SubjectMeta } from "./types";

/**
 * The six CAIE AS & A Level subjects this site aggregates.
 * Each entry carries the metadata scrapers need to target each site.
 */
export const SUBJECTS: SubjectMeta[] = [
  {
    code: "9709",
    name: "Mathematics",
    shortName: "Maths",
    level: "AS & A Level",
    color: "#2563eb", // blue
    papacambridgeSlug: "as-and-a-level-mathematics-9709",
    notesSlug: "mathematics-9709",
    pmtPath: "a-level-maths",
  },
  {
    code: "9702",
    name: "Physics",
    shortName: "Physics",
    level: "AS & A Level",
    color: "#7c3aed", // violet
    papacambridgeSlug: "as-and-a-level-physics-9702",
    notesSlug: "physics-9702",
    pmtPath: "a-level-physics",
  },
  {
    code: "9618",
    name: "Computer Science",
    shortName: "CS",
    level: "AS & A Level",
    color: "#0891b2", // cyan
    papacambridgeSlug: "as-and-a-level-computer-science-9618",
    notesSlug: "computer-science-9618-from-2021-new",
    pmtPath: "a-level-computer-science",
  },
  {
    code: "9231",
    name: "Further Mathematics",
    shortName: "Further Maths",
    level: "AS & A Level",
    color: "#d97706", // amber
    papacambridgeSlug: "as-and-a-level-mathematics-further-9231",
    notesSlug: "mathematics-further-9231",
  },
  {
    code: "9700",
    name: "Biology",
    shortName: "Biology",
    level: "AS & A Level",
    color: "#16a34a", // green
    papacambridgeSlug: "as-and-a-level-biology-9700",
    notesSlug: "biology-9700",
    pmtPath: "a-level-biology",
  },
  {
    code: "9701",
    name: "Chemistry",
    shortName: "Chemistry",
    level: "AS & A Level",
    color: "#dc2626", // red
    papacambridgeSlug: "as-and-a-level-chemistry-9701",
    notesSlug: "chemistry-9701",
    pmtPath: "a-level-chemistry",
  },
];

const byCode = new Map(SUBJECTS.map((s) => [s.code, s]));

export function getSubject(code: string): SubjectMeta | undefined {
  return byCode.get(code);
}

/**
 * Paper components (and file kinds) to probe on the CAIE paper CDN,
 * derived from papaCambridge's own file inventory. One-digit era files
 * (pre-~2009) are intentionally out of scope.
 */
export const CDN_COMPONENTS: Record<string, string[]> = {
  // component digits in order: P1 P2 P3 M1 M2 S1 S2 (+ variants)
  "9709": ["11", "12", "13", "21", "22", "23", "31", "32", "33", "41", "42", "43", "51", "52", "53", "61", "62", "63", "71", "72", "73"],
  // papers 1–5 (paper 3 carries the 6 practical options on the old spec)
  "9702": ["11", "12", "13", "21", "22", "23", "31", "32", "33", "34", "35", "36", "41", "42", "43", "51", "52", "53"],
  "9618": ["11", "12", "13", "21", "22", "23", "31", "32", "33", "41", "42", "43"],
  "9231": ["11", "12", "13", "21", "22", "23", "31", "32", "33", "41", "42", "43"],
  "9700": ["11", "12", "13", "21", "22", "23", "31", "32", "33", "34", "35", "36", "41", "42", "43", "51", "52", "53"],
  "9701": ["11", "12", "13", "21", "22", "23", "31", "32", "33", "34", "35", "36", "41", "42", "43", "51", "52", "53"],
};

/** File kinds probed per session. `gt` carries no component suffix. */
export const CDN_KINDS = ["qp", "ms", "gt"] as const;

/** Map a 2-digit CAIE component code to a human label. */
export function componentLabel(code: string): string {
  const d = code[0];
  const map: Record<string, string> = {
    "1": "Paper 1",
    "2": "Paper 2",
    "3": "Paper 3",
    "4": "Paper 4",
    "5": "Paper 5",
    "6": "Paper 6",
    "7": "Paper 7",
  };
  return map[d] ?? `Paper ${d}`;
}
