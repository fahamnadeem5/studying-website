import { NextResponse } from "next/server";
import { existsSync, readdirSync, statSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { dirname, resolve } from "node:path";

export const dynamic = "force-dynamic";

/** TEMPORARY diagnostic route — remove after debugging the Vercel 500s. */
export async function GET() {
  const out: Record<string, unknown> = {
    node: process.version,
    cwd: process.cwd(),
    platform: process.platform,
  };

  let dbPath: string;
  try {
    dbPath = process.env.ALEVELHUB_DB ?? resolve(process.cwd(), "data", "alevelhub.db");
  } catch (e) {
    dbPath = `resolve threw: ${(e as Error).message}`;
  }
  out.dbPath = dbPath;

  const dir = typeof dbPath === "string" ? dirname(dbPath) : "?";
  try {
    out.dataDir = readdirSync(dir).map(
      (f) => `${f} (${statSync(resolve(dir, f)).size} bytes)`
    );
  } catch (e) {
    out.dataDir = `readdir ERR: ${(e as Error).message}`;
  }
  if (typeof dbPath === "string") {
    try {
      out.dbExists = existsSync(dbPath);
    } catch (e) {
      out.dbExists = `existsSync ERR: ${(e as Error).message}`;
    }
  }

  const strategies: Array<[string, () => unknown]> = [
    [
      "writableOpen",
      () => {
        const d = new DatabaseSync(dbPath as string);
        const n = d.prepare("SELECT COUNT(*) AS n FROM resources").get();
        d.close();
        return n;
      },
    ],
    [
      "readOnlyOpen",
      () => {
        const d = new DatabaseSync(dbPath as string, { readOnly: true });
        const n = d.prepare("SELECT COUNT(*) AS n FROM resources").get();
        d.close();
        return n;
      },
    ],
    [
      "inMemoryOpen",
      () => {
        const d = new DatabaseSync(":memory:");
        const ok = d.prepare("SELECT 1 AS ok").get();
        d.close();
        return ok;
      },
    ],
  ];

  for (const [name, fn] of strategies) {
    try {
      out[name] = JSON.stringify(fn());
    } catch (e) {
      out[name] = `THREW: ${(e as Error).message}`;
    }
  }

  return NextResponse.json(out);
}
