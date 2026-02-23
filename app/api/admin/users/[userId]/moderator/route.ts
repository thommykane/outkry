import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { moderators } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  await requireAdmin();

  const { userId } = await params;
  const body = await req.json();
  const { categoryId } = body;

  if (!categoryId) {
    return NextResponse.json({ error: "categoryId required" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(moderators)
    .where(and(eq(moderators.userId, userId), eq(moderators.categoryId, categoryId)))
    .limit(1);

  if (existing) {
    await db
      .delete(moderators)
      .where(and(eq(moderators.userId, userId), eq(moderators.categoryId, categoryId)));
    return NextResponse.json({ success: true, added: false });
  }

  await db.insert(moderators).values({ userId, categoryId });
  return NextResponse.json({ success: true, added: true });
}
