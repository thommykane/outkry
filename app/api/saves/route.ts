import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savedPosts, posts, users, sessions } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get("session")?.value;
  if (!sessionId) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  if (!session || new Date(session.expiresAt) < new Date())
    return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const forUserId = searchParams.get("userId");
  if (forUserId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const userId = session.userId;

  const saved = await db
    .select({
      postId: savedPosts.postId,
      savedAt: savedPosts.savedAt,
    })
    .from(savedPosts)
    .where(eq(savedPosts.userId, userId))
    .orderBy(desc(savedPosts.savedAt))
    .limit(100);

  const postIds = saved.map((s) => s.postId);
  if (postIds.length === 0) return NextResponse.json({ posts: [] });

  const allPosts = await Promise.all(postIds.map((id) => db.select().from(posts).where(eq(posts.id, id)).limit(1)));
  const flatPosts = allPosts.flat().filter(Boolean);
  const savedAtMap: Record<string, string> = {};
  saved.forEach((s) => { savedAtMap[s.postId] = s.savedAt.toISOString(); });

  const postsWithAuthor = await Promise.all(
    flatPosts.map(async (p) => {
      const [author] = await db.select().from(users).where(eq(users.id, p.authorId)).limit(1);
      return {
        ...p,
        author: author ? { username: author.username, avatarUrl: author.avatarUrl } : null,
        savedAt: savedAtMap[p.id],
      };
    })
  );
  postsWithAuthor.sort((a, b) => (b.savedAt ?? "").localeCompare(a.savedAt ?? ""));

  return NextResponse.json({ posts: postsWithAuthor });
}

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get("session")?.value;
  if (!sessionId) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  if (!session || new Date(session.expiresAt) < new Date())
    return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const postId = body.postId;
  const action = body.action; // "save" | "unsave"
  if (!postId || !action) return NextResponse.json({ error: "postId and action required" }, { status: 400 });

  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  if (action === "save") {
    await db
      .insert(savedPosts)
      .values({ userId: session.userId, postId })
      .onConflictDoNothing();
    return NextResponse.json({ saved: true });
  }
  if (action === "unsave") {
    await db
      .delete(savedPosts)
      .where(and(eq(savedPosts.userId, session.userId), eq(savedPosts.postId, postId)));
    return NextResponse.json({ saved: false });
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
