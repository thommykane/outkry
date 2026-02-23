import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const items = await db
      .select()
      .from(posts)
      .where(eq(posts.authorId, userId))
      .orderBy(desc(posts.createdAt))
      .limit(50);

    const postsWithAuthor = await Promise.all(
      items.map(async (p) => {
        const [author] = await db.select().from(users).where(eq(users.id, p.authorId)).limit(1);
        return {
          ...p,
          author: author ? { username: author.username, avatarUrl: author.avatarUrl } : null,
        };
      })
    );

    return NextResponse.json({ posts: postsWithAuthor });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ posts: [] });
  }
}
