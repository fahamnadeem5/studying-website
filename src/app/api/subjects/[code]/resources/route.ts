import { NextResponse } from "next/server";
import { listResources, countResources } from "@/lib/db";
import { getSubject } from "@/lib/subjects";
import type { ResourceType, SessionLetter } from "@/lib/types";

export const dynamic = "force-dynamic";

function clamp(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo;
  return Math.max(lo, Math.min(hi, v));
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code } = await ctx.params;
  if (!getSubject(code)) {
    return NextResponse.json({ error: "Unknown subject" }, { status: 404 });
  }
  const sp = new URL(req.url).searchParams;
  const typeRaw = sp.get("type");
  const type = (typeRaw === "yearly" || typeRaw === "topical" ||
    typeRaw === "notes" || typeRaw === "book"
    ? typeRaw
    : null) as ResourceType | null;
  const opts = {
    subjectCode: code,
    type: type ?? undefined,
    year: sp.get("year") ? Number(sp.get("year")) : undefined,
    session: (sp.get("session") as SessionLetter | null) ?? undefined,
    kind: sp.get("kind") ?? undefined,
    topic: sp.get("topic") ?? undefined,
    source: sp.get("source") ?? undefined,
    paper: sp.get("paper") ?? undefined,
    limit: clamp(Number(sp.get("limit") ?? 500), 1, 1000),
    offset: clamp(Number(sp.get("offset") ?? 0), 0, 1_000_000),
  };
  const rows = listResources(opts);
  const total = countResources({
    subjectCode: code,
    type: type ?? undefined,
  });
  return NextResponse.json({ total, count: rows.length, resources: rows });
}
