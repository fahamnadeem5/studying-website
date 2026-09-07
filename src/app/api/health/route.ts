import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Health check — no DB introspection, no paths, no version. The
 * earlier diagnostic version leaked filesystem details and was
 * shipped accidentally. This one returns a fixed JSON shape so
 * uptime monitors get a stable contract.
 */
export async function GET() {
  return NextResponse.json({ ok: true });
}
