/**
 * notes.papaCambridge source — subject notes (free tier).
 *
 * notes.papacambridge.com serves static pages per subject with direct
 * `download_file.php?files=<notes CDN url>` links. Each subject page may also
 * link to its own `-topical-notes` sub-page. Crawling is strictly scoped to
 * pages belonging to the current subject (never the all-subjects index), so
 * every indexed file maps to the right subject.
 */

import { httpFetch } from "./common";
import { upsertResource } from "../../src/lib/db";
import { SUBJECTS } from "../../src/lib/subjects";

export const NOTES_PAPACAMBRIDGE_SOURCE = "notes-papacambridge";
const NOTES_BASE = "https://notes.papacambridge.com";
const SUBJECT_PAGE_MARKER =
  "cambridge-advancedcambridge-international-as-and-a-level-subjects-";

interface PageFiles {
  downloadUrl: string;
  fileUrl: string;
  name: string;
}

async function parseNotesPage(url: string): Promise<{
  files: PageFiles[];
  folders: string[];
}> {
  const res = await httpFetch(url, { timeoutMs: 25_000 });
  const html = await res.text();
  const files: PageFiles[] = [];
  const folders: string[] = [];

  const dlRe = /href=["']([^"']*download_file\.php\?files=([^"']+))["']/gi;
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = dlRe.exec(html))) {
    const downloadUrl = m[1];
    if (seen.has(downloadUrl)) continue;
    seen.add(downloadUrl);
    let fileUrl = m[2];
    try {
      fileUrl = decodeURIComponent(fileUrl);
    } catch {
      /* keep raw */
    }
    const name = fileUrl.split("/").pop() ?? "";
    if (!/\.(pdf|zip)$/i.test(name)) continue;
    files.push({ downloadUrl, fileUrl, name });
  }

  // Sub-pages only — sibling subject links and the generic index are skipped
  // by the caller's allow-list.
  const folderRe = /href=["']([^"']*notes\/caie\/[^"']+)["']/gi;
  const seenFolders = new Set<string>();
  while ((m = folderRe.exec(html))) {
    let f = m[1];
    // hrefs are relative to the site root, e.g. `notes/caie/…`
    if (f.startsWith("notes/")) {
      f = `${NOTES_BASE}/${f}`;
    } else if (f.startsWith("/")) {
      f = NOTES_BASE + f;
    } else {
      try {
        f = new URL(f, NOTES_BASE + "/").href;
      } catch {
        continue;
      }
    }
    if (!seenFolders.has(f) && f.startsWith(NOTES_BASE)) {
      seenFolders.add(f);
      folders.push(f);
    }
  }
  return { files, folders };
}

/** Turn a filename into a presentable title. */
function humanize(name: string): string {
  const base = name.replace(/\.(pdf|zip)$/i, "");
  const words = base.split(/[_\-\s]+/).filter(Boolean);
  // drop leading upload-id style numeric prefixes (e.g. "151728-learner-guide")
  while (words.length > 0 && /^\d+$/.test(words[0])) words.shift();
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function scrapeNotesPapaCambridge(opts: {
  codes?: string[];
  log?: (m: string) => void;
}): Promise<number> {
  const log = opts.log ?? (() => {});
  const allCodes = SUBJECTS.map((s) => s.code);
  const codes =
    opts.codes && opts.codes.length > 0 ? opts.codes : allCodes;
  let found = 0;

  for (const subject of SUBJECTS) {
    if (!codes.includes(subject.code)) continue;
    const start = `${NOTES_BASE}/notes/caie/${SUBJECT_PAGE_MARKER}${subject.notesSlug}`;
    // allow only pages that belong to this subject (the start page or
    // sub-pages like `<start>-topical-notes`)
    const isOwn = (u: string) => u === start || u.startsWith(start + "-");
    const queue: string[] = [start];
    const visited = new Set<string>([start]);
    let subjectCount = 0;
    log(`  [notes-papacambridge] ${subject.code} ${subject.shortName}…`);

    while (queue.length) {
      const pageUrl = queue.shift()!;
      const page = await parseNotesPage(pageUrl);
      for (const f of page.files) {
        const isTopical = /topical/.test(pageUrl);
        const title = humanize(f.name) || f.name;
        const res = upsertResource({
          subjectCode: subject.code,
          type: "notes",
          title,
          url: new URL(f.downloadUrl, NOTES_BASE).href,
          source: NOTES_PAPACAMBRIDGE_SOURCE,
          description: isTopical
            ? "Topical notes from notes.papaCambridge"
            : "Revision notes from notes.papaCambridge",
          metadata: { file: f.name },
        });
        if (res.action !== "skipped") {
          found += 1;
          subjectCount += 1;
        }
      }
      for (const folder of page.folders) {
        if (isOwn(folder) && !visited.has(folder)) {
          visited.add(folder);
          queue.push(folder);
        }
      }
    }
    log(`  [notes-papacambridge] ${subject.code}: ${subjectCount} files`);
  }

  return found;
}