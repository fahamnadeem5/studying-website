import { NextResponse } from "next/server";
import { subjectCounts } from "@/lib/db";
import { SUBJECTS } from "@/lib/subjects";

export const dynamic = "force-dynamic";

export async function GET() {
  const subjects = SUBJECTS.map((s) => {
    const counts = subjectCounts(s.code);
    return {
      code: s.code,
      name: s.name,
      shortName: s.shortName,
      level: s.level,
      color: s.color,
      counts,
    };
  });
  return NextResponse.json({ subjects });
}
