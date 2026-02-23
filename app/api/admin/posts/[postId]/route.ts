import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts, votes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  await requireAdmin();

  const { postId } = await params;

  await db.delete(votes).where(eq(votes.postId, postId));
  await db.delete(posts).where(eq(posts.id, postId));

  return NextResponse.json({ success: true });
}
