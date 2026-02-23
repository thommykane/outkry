import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { votes, posts, sessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const ARCHIVE_SCORE = 500;

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get("session")?.value;
    if (!sessionId) {
      return NextResponse.json({ error: "Login required to vote" }, { status: 401 });
    }

    const { users } = await import("@/lib/db/schema");
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    if (!session || new Date(session.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }
    const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    if (user?.banned) {
      const stillBanned = !user.bannedUntil || new Date(user.bannedUntil) > new Date();
      if (stillBanned) {
        return NextResponse.json({ error: "You are banned from voting" }, { status: 403 });
      }
    }

    const body = await req.json();
    const postId = body.postId;
    const value = body.value;

    if (!postId || (value !== 1 && value !== -1)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(votes)
      .where(and(eq(votes.postId, postId), eq(votes.userId, session.userId)))
      .limit(1);

    const [post] = await db
      .select({ score: posts.score, authorId: posts.authorId })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    if (post.authorId === session.userId) {
      return NextResponse.json({ error: "You cannot vote on your own post" }, { status: 403 });
    }

    let newScore: number = post.score ?? 0;
    const voteValue = value;

    if (existing) {
      const diff = voteValue - existing.value;
      newScore = (post.score ?? 0) + diff;
      await db
        .update(votes)
        .set({ value: voteValue })
        .where(and(eq(votes.postId, postId), eq(votes.userId, session.userId)));
    } else {
      newScore = (post.score ?? 0) + voteValue;
      await db.insert(votes).values({
        postId,
        userId: session.userId,
        value: voteValue,
      });
    }

    await db
      .update(posts)
      .set({
        score: newScore,
        isArchived: newScore >= ARCHIVE_SCORE,
      })
      .where(eq(posts.id, postId));

    return NextResponse.json({ newScore });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}
