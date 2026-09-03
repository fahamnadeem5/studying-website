import { NextResponse } from "next/server";
import { searchResources, likeSearch } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/search?q=...&subject=9709&type=notes
 * Full-text search over the pre-scraped catalog (instant, offline).
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ query: q, resources: [] });
  }
  const subject = sp.get("subject") ?? undefined;
  const typeRaw = sp.get("type");
  const type: "yearly" | "topical" | "notes" | "book" | undefined =
    typeRaw === "yearly" ||
    typeRaw === "topical" ||
    typeRaw === "notes" ||
    typeRaw === "book"
      ? typeRaw
      : undefined;

  const opts = { subjectCode: subject, type, limit: 80 };
  const rows = searchResources(q, opts);
  // FTS tokenizer edge cases (e.g. "9709" digits are fine, but symbols
  // like "p1 p2" collapse) — pad with a substring search when short.
  const fallback = rows.length < 5 ? likeSearch(q, opts) : [];
  const seen = new Set(rows.map((r) => r.id));
  const merged = [
    ...rows,
    ...fallback.filter((r) => !seen.has(r.id)),
  ].slice(0, 80);

  return NextResponse.json({
    query: q,
    subject: subject ?? null,
    type: type ?? null,
    count: merged.length,
    resources: merged,
  });
}
