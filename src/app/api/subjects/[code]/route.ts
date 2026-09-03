import { NextResponse } from "next/server";
import { subjectCounts, subjectYears, listResources } from "@/lib/db";
import { getSubject } from "@/lib/subjects";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code } = await ctx.params;
  const subject = getSubject(code);
  if (!subject) {
    return NextResponse.json({ error: "Unknown subject" }, { status: 404 });
  }
  const counts = subjectCounts(code);
  const years = subjectYears(code);

  const sessions = ["m", "s", "w"].filter((l) =>
    listResources({ subjectCode: code, session: l as never, limit: 1 })
      .length
  );
  const sources = listResources({ subjectCode: code, limit: 1000 })
    .map((r) => r.source)
    .filter((v, i, a) => a.indexOf(v) === i);

  return NextResponse.json({
    code: subject.code,
    name: subject.name,
    shortName: subject.shortName,
    counts,
    years,
    sessions,
    sources,
  });
}
