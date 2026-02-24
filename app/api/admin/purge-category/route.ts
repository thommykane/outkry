import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts, votes } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";

export async function POST(req: NextRequest) {
  await requireAdmin();

  const body = await req.json().catch(() => ({}));
  const categoryId = body.categoryId as string | undefined;
  if (!categoryId?.trim()) {
    return NextResponse.json({ error: "categoryId required" }, { status: 400 });
  }

  const postIds = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.categoryId, categoryId));
  const ids = postIds.map((r) => r.id);

  if (ids.length > 0) {
    await db.delete(votes).where(inArray(votes.postId, ids));
    await db.delete(posts).where(eq(posts.categoryId, categoryId));
  }

  return NextResponse.json({ success: true, deleted: ids.length });
}
