/**
 * papaCambridge source — yearly past papers.
 *
 * papaCambridge's own pages are heavily JS-driven these days, but their paper
 * CDN (pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/)
 * still hosts every paper under the standard CAIE filename scheme, e.g.
 *  9709_s24_qp_12.pdf, 9702_w19_ms_41.pdf, 9700_m21_gt.pdf
 *
 * Strategy (all links point back at papaCambridge's own CDN — no copies kept):
 *  1. detect which sessions actually exist by probing each session's grade
 *     thresholds file (`{code}_{s}{yy}_gt.pdf`) — CAIE publishes these for
 *     every real session, so a 2xx is a reliable existence check;
 *  2. for each existing session, probe the question-paper and mark-scheme
 *     components known to be used by that subject (component inventory
 *     derived from papaCambridge's public sitemap);
 *  3. upsert everything found into the local catalog.
 */

import { mapPool, urlExists } from "./common";
import { upsertResource } from "../../src/lib/db";
import { getSubject } from "../../src/lib/subjects";
import { yearlyPaperTitle } from "../../src/lib/format";
import type { NewResource, PaperKind, SessionLetter } from "../../src/lib/types";

export const PAPACAMBRIDGE_SOURCE = "papacambridge";
const CDN_BASE =
  "https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/";
const LETTERS: SessionLetter[] = ["m", "s", "w"];

export interface PapaCambridgeOptions {
  fromYear: number;
  toYear: number;
  codes?: string[];
  log?: (msg: string) => void;
}

export interface PapaCambridgeStats {
  sessionsDetected: number;
  filesFound: number;
  probes: number;
}

export function cdnUrl(filename: string): string {
  return CDN_BASE + filename;
}

function two(yy: number): string {
  return String(yy).padStart(2, "0");
}

/** Components that plausibly existed in a given year for a subject. */
function compsForEra(
  code: string,
  year: number,
  all: string[]
): string[] {
  // Maths / Further Maths split into variants from 2020; the sciences (paper
  // 3 practical options) earlier. Before that only the `1`-variant existed.
  const variantCutoff =
    code === "9709" || code === "9231" ? 2020 : code === "9618" ? 2021 : 2015;
  if (year >= variantCutoff) return all;
  return all.filter((c) => c.endsWith("1"));
}

export async function scrapePapaCambridge(
  opts: PapaCambridgeOptions
): Promise<PapaCambridgeStats> {
  const log = opts.log ?? (() => {});
  const stats: PapaCambridgeStats = {
    sessionsDetected: 0,
    filesFound: 0,
    probes: 0,
  };

  const codes =
    opts.codes && opts.codes.length > 0
      ? opts.codes
      : ["9709", "9702", "9618", "9231", "9700", "9701"];

  for (const code of codes) {
    const subject = getSubject(code);
    if (!subject) {
      log(`  [papaCambridge] unknown subject code ${code}`);
      continue;
    }
    log(`  [papaCambridge] ${code} ${subject.shortName} — detecting sessions…`);

    // ---- 1. session detection via grade thresholds -----------------------
    const sessions: Array<{ letter: SessionLetter; year: number }> = [];
    const candidates: Array<{ letter: SessionLetter; year: number; file: string }> = [];
    for (const letter of LETTERS) {
      for (let year = opts.fromYear; year <= opts.toYear; year++) {
        candidates.push({ letter, year, file: `${code}_${letter}${two(year)}_gt.pdf` });
      }
    }
    const exists = await mapPool(
      candidates,
      8,
      async (c) => ({
        c,
        ok: await urlExists(cdnUrl(c.file), {
          minSpacingMs: 60,
          retries: 0,
        }),
      })
    );
    for (const { c, ok } of exists) {
      stats.probes += 1;
      if (!ok) continue;
      sessions.push({ letter: c.letter, year: c.year });
      stats.sessionsDetected += 1;
      upsertResource({
        subjectCode: code,
        type: "yearly",
        title: yearlyPaperTitle(subject.name, c.letter, c.year, null, "gt"),
        url: cdnUrl(c.file),
        source: PAPACAMBRIDGE_SOURCE,
        kind: "gt",
        year: c.year,
        session: c.letter,
        metadata: { file: c.file },
      });
      stats.filesFound += 1;
    }

    log(
      `  [papaCambridge] ${code}: ${sessions.length} sessions (${stats.sessionsDetected} total)`
    );

    // ---- 2. per-session component probing --------------------------------
    const comps = (await import("../../src/lib/subjects")).CDN_COMPONENTS[code] ?? [
      "11",
      "21",
      "31",
    ];

    const tasks: Array<{ letter: SessionLetter; year: number; kind: PaperKind; comp: string | null; file: string }> = [];
    for (const { letter, year } of sessions) {
      // CAIE only ran single-variant papers before the syllabuses split into
      // variants — skip probing non-`1` components for those eras.
      const eraComps = compsForEra(code, year, comps);
      for (const comp of eraComps) {
        for (const kind of ["qp", "ms"] as PaperKind[]) {
          const file = `${code}_${letter}${two(year)}_${kind}_${comp}.pdf`;
          tasks.push({ letter, year, kind, comp, file });
        }
      }
    }

    const results = await mapPool(tasks, 8, async (t, i) => {
      const ok = await urlExists(cdnUrl(t.file), {
        minSpacingMs: 60,
        retries: 0,
      });
      if (i % 400 === 0 && i > 0) {
        log(
          `  [papaCambridge] ${code}: probed ${i + 1}/${tasks.length} components…`
        );
      }
      return { t, ok };
    });
    for (const { t, ok } of results) {
      stats.probes += 1;
      if (!ok) continue;
      const r: NewResource = {
        subjectCode: code,
        type: "yearly",
        title: yearlyPaperTitle(subject.name, t.letter, t.year, t.comp, t.kind),
        url: cdnUrl(t.file),
        source: PAPACAMBRIDGE_SOURCE,
        kind: t.kind,
        year: t.year,
        session: t.letter,
        paper: t.comp ? `Paper ${t.comp[0]}` : null,
        variant: t.comp && t.comp[1] !== "1" ? Number(t.comp[1]) : 1,
        metadata: { file: t.file, component: t.comp },
      };
      upsertResource(r);
      stats.filesFound += 1;
    }
    log(
      `  [papaCambridge] ${code}: +${stats.filesFound} files so far (${stats.probes} probes)`
    );
  }

  return stats;
}
