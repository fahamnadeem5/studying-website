/**
 * Physics & Maths Tutor source — CAIE yearly papers (QP/MS).
 *
 * PMT hosts static collections per CAIE subject/paper, e.g.
 *   /past-papers/a-level-physics/cie-paper-2/
 * listing direct PDFs on pmt.physicsandmathstutor.com/download/.../CAIE/...
 */

import { httpFetch, mapPool, hrefs } from "./common";
import { upsertResource } from "../../src/lib/db";
import { SUBJECTS } from "../../src/lib/subjects";
import type { NewResource, PaperKind, SessionLetter } from "../../src/lib/types";

export const PMT_SOURCE = "pmt";
const PMT_ROOT = "https://www.physicsandmathstutor.com";
const PMT_DOWNLOAD_RE =
  /^https:\/\/pmt\.physicsandmathstutor\.com\/download\/.*\/CAIE\/.*\.pdf$/i;

const MONTH_TO_SESSION: Record<string, SessionLetter> = {
  january: "m",
  jan: "m",
  february: "m",
  feb: "m",
  march: "m",
  mar: "m",
  june: "s",
  jun: "s",
  may: "s",
  october: "w",
  oct: "w",
  november: "w",
  nov: "w",
};

export async function scrapePmt(opts: {
  codes?: string[];
  log?: (m: string) => void;
}): Promise<number> {
  const log = opts.log ?? (() => {});
  const allCodes = SUBJECTS.filter((s) => s.pmtPath).map((s) => s.code);
  const codes =
    opts.codes && opts.codes.length > 0 ? opts.codes : allCodes;
  let found = 0;

  const subjects = SUBJECTS.filter((s) => codes.includes(s.code) && s.pmtPath);

  for (const subject of subjects) {
    const indexUrl = `${PMT_ROOT}/past-papers/${subject.pmtPath}/`;
    log(`  [pmt] ${subject.code} ${subject.shortName}…`);
    let indexHtml = "";
    try {
      const res = await httpFetch(indexUrl, { timeoutMs: 25_000 });
      indexHtml = await res.text();
    } catch {
      log(`  [pmt] ${subject.code}: index fetch failed, skipping`);
      continue;
    }

    const paperPageSet = new Set<string>();
    for (const h of hrefs(indexHtml, indexUrl)) {
      const m = /\/past-papers\/[^/]+\/cie-paper-(\d+)\/?$/.exec(h);
      if (m) paperPageSet.add(h.replace(/\/$/, ""));
    }
    if (paperPageSet.size === 0) {
      log(`  [pmt] ${subject.code}: no CAIE paper pages found, skipping`);
      continue;
    }
    const paperPages = [...paperPageSet].sort((a, b) => {
      const ma = /cie-paper-(\d+)/.exec(a);
      const mb = /cie-paper-(\d+)/.exec(b);
      return Number(ma?.[1] ?? 0) - Number(mb?.[1] ?? 0);
    });

    const perPage = await mapPool(paperPages, 2, async (pageUrl) => {
      let html = "";
      try {
        const res = await httpFetch(pageUrl, { timeoutMs: 25_000 });
        html = await res.text();
      } catch {
        return 0;
      }
      let count = 0;
      for (const h of hrefs(html, pageUrl)) {
        const row = classifyPmtLink(h, subject);
        if (!row) continue;
        upsertResource(row);
        count += 1;
      }
      return count;
    });

    const pageCount = perPage.reduce((a, b) => a + b, 0);
    found += pageCount;
    log(
      `  [pmt] ${subject.code}: ${pageCount} files across ${paperPages.length} paper pages`
    );
  }

  return found;
}

function classifyPmtLink(
  h: string,
  subject: { code: string; name: string }
): NewResource | null {
  if (!PMT_DOWNLOAD_RE.test(h)) return null;
  const isQP = /\/QP\//i.test(h);
  const isMS = /\/MS\//i.test(h);
  if (!isQP && !isMS) return null;
  const kind: PaperKind = isQP ? "qp" : "ms";

  const paperM = /\/Paper-(\d+)\//i.exec(h);
  const paper = paperM ? `Paper ${paperM[1]}` : null;

  const filename = decodeURIComponent(h.split("/").pop() ?? "");
  const base = filename.replace(/\.pdf$/i, "");

  // e.g. "June 2010 (v1) QP", "Nov 2017 MS", "October/November 2019 (v2) QP"
  const m =
    /^([A-Za-z\/ ]+?)\s+(\d{4})(?:\s*\(v(\d)\))?\s*(QP|MS)$/i.exec(base);
  let session: SessionLetter | null = null;
  let year: number | null = null;
  let variant: number | null = null;
  let title: string;

  if (m) {
    const monthStr = m[1].toLowerCase();
    for (const [k, v] of Object.entries(MONTH_TO_SESSION)) {
      if (monthStr.includes(k)) {
        session = v;
        break;
      }
    }
    year = Number(m[2]);
    variant = m[3] ? Number(m[3]) : null;
    const when = sessionYearLabel(session, year);
    title = `${subject.name} CAIE ${when}${paper ? " " + paper : ""}${
      variant && variant > 1 ? ` (Variant ${variant})` : ""
    } — ${kind === "qp" ? "Question Paper" : "Mark Scheme"}`;
  } else {
    title = `${subject.name} CAIE ${base} — ${
      kind === "qp" ? "Question Paper" : "Mark Scheme"
    }`;
  }

  return {
    subjectCode: subject.code,
    type: "yearly",
    title,
    url: h,
    source: PMT_SOURCE,
    kind,
    year,
    session,
    paper,
    variant,
    metadata: { filename },
  };
}

function sessionYearLabel(s: SessionLetter | null, year: number | null): string {
  if (!s || !year) return year ? `${year}` : "various sessions";
  const name = { m: "Feb/March", s: "May/June", w: "Oct/Nov" }[s];
  return `${name} ${year}`;
}
