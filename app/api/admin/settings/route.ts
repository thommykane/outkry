import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getScoreThresholds, setScoreThresholds } from "@/lib/settings";

export async function GET() {
  await requireAdmin();
  const thresholds = await getScoreThresholds();
  return NextResponse.json(thresholds);
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  const body = await req.json().catch(() => ({}));
  const topScoreThreshold =
    body.topScoreThreshold !== undefined ? parseInt(String(body.topScoreThreshold), 10) : undefined;
  const archiveScore =
    body.archiveScore !== undefined ? parseInt(String(body.archiveScore), 10) : undefined;
  if (topScoreThreshold !== undefined && (Number.isNaN(topScoreThreshold) || topScoreThreshold < 0)) {
    return NextResponse.json({ error: "Invalid top score threshold" }, { status: 400 });
  }
  if (archiveScore !== undefined && (Number.isNaN(archiveScore) || archiveScore < 0)) {
    return NextResponse.json({ error: "Invalid archive score" }, { status: 400 });
  }
  await setScoreThresholds({ topScoreThreshold, archiveScore });
  const thresholds = await getScoreThresholds();
  return NextResponse.json(thresholds);
}
