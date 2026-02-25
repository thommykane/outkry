import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import {
  getScoreThresholds,
  setScoreThresholds,
  getAutoDeleteScore,
  setAutoDeleteScore,
  getMainPageOrder,
  setMainPageOrder,
  type MainPageOrder,
} from "@/lib/settings";

export async function GET() {
  await requireAdmin();
  const [thresholds, autoDeleteScore, mainPageOrder] = await Promise.all([
    getScoreThresholds(),
    getAutoDeleteScore(),
    getMainPageOrder(),
  ]);
  return NextResponse.json({ ...thresholds, autoDeleteScore, mainPageOrder });
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  const body = await req.json().catch(() => ({}));
  const topScoreThreshold =
    body.topScoreThreshold !== undefined ? parseInt(String(body.topScoreThreshold), 10) : undefined;
  const archiveScore =
    body.archiveScore !== undefined ? parseInt(String(body.archiveScore), 10) : undefined;
  const autoDeleteScore =
    body.autoDeleteScore !== undefined ? parseInt(String(body.autoDeleteScore), 10) : undefined;
  const mainPageOrder = body.mainPageOrder as MainPageOrder | undefined;
  if (topScoreThreshold !== undefined && (Number.isNaN(topScoreThreshold) || topScoreThreshold < 0)) {
    return NextResponse.json({ error: "Invalid top score threshold" }, { status: 400 });
  }
  if (archiveScore !== undefined && (Number.isNaN(archiveScore) || archiveScore < 0)) {
    return NextResponse.json({ error: "Invalid archive score" }, { status: 400 });
  }
  if (autoDeleteScore !== undefined && Number.isNaN(autoDeleteScore)) {
    return NextResponse.json({ error: "Invalid auto-delete score" }, { status: 400 });
  }
  if (mainPageOrder !== undefined && mainPageOrder !== "recent" && mainPageOrder !== "top") {
    return NextResponse.json({ error: "Invalid main page order" }, { status: 400 });
  }
  await setScoreThresholds({ topScoreThreshold, archiveScore });
  if (autoDeleteScore !== undefined) await setAutoDeleteScore(autoDeleteScore);
  if (mainPageOrder !== undefined) await setMainPageOrder(mainPageOrder);
  const [thresholds, newAutoDelete, newMainOrder] = await Promise.all([
    getScoreThresholds(),
    getAutoDeleteScore(),
    getMainPageOrder(),
  ]);
  return NextResponse.json({ ...thresholds, autoDeleteScore: newAutoDelete, mainPageOrder: newMainOrder });
}
