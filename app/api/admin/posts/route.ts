import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";

export async function GET(req: NextRequest) {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

  let query = db
    .select()
    .from(posts)
    .orderBy(desc(posts.createdAt))
    .limit(limit);

  if (categoryId) {
    const items = await db
      .select()
      .from(posts)
      .where(eq(posts.categoryId, categoryId))
      .orderBy(desc(posts.createdAt))
      .limit(limit);
    const withAuthors = await Promise.all(
      items.map(async (p) => {
        const [author] = await db.select().from(users).where(eq(users.id, p.authorId)).limit(1);
        return { ...p, author: author ? { username: author.username } : null };
      })
    );
    return NextResponse.json({ posts: withAuthors });
  }

  const items = await db
    .select()
    .from(posts)
    .orderBy(desc(posts.createdAt))
    .limit(limit);

  const withAuthors = await Promise.all(
    items.map(async (p) => {
      const [author] = await db.select().from(users).where(eq(users.id, p.authorId)).limit(1);
      return { ...p, author: author ? { username: author.username } : null };
    })
  );

  return NextResponse.json({ posts: withAuthors });
}
