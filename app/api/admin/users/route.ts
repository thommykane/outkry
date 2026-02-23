import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, posts, votes, sessions, moderators } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const { user } = await requireAdmin();

  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") || "signup";

  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

  const usersWithStats = await Promise.all(
    allUsers.map(async (u) => {
      const [postCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(posts)
        .where(eq(posts.authorId, u.id));
      const [avgScore] = await db
        .select({ avg: sql<number>`coalesce(avg(${posts.score}), 0)::int` })
        .from(posts)
        .where(eq(posts.authorId, u.id));
      const [mods] = await db.select().from(moderators).where(eq(moderators.userId, u.id));
      const [latestSession] = await db
        .select({ ipAddress: sessions.ipAddress })
        .from(sessions)
        .where(eq(sessions.userId, u.id))
        .orderBy(desc(sessions.createdAt))
        .limit(1);
      return {
        ...u,
        postCount: postCount?.count ?? 0,
        avgScore: avgScore?.avg ?? 0,
        isModerator: !!mods,
        lastIpAddress: latestSession?.ipAddress ?? null,
      };
    })
  );

  if (sort === "avgScore") usersWithStats.sort((a, b) => b.avgScore - a.avgScore);
  else if (sort === "postCount") usersWithStats.sort((a, b) => b.postCount - a.postCount);
  else if (sort === "signup") usersWithStats.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  else if (sort === "signupAsc") usersWithStats.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return NextResponse.json({ users: usersWithStats });
}

export async function POST(req: NextRequest) {
  await requireAdmin();

  const body = await req.json();
  const { action, userId, banUntil } = body;

  if (!action || !userId) {
    return NextResponse.json({ error: "action and userId required" }, { status: 400 });
  }

  if (action === "ban") {
    await db
      .update(users)
      .set({
        banned: true,
        bannedUntil: banUntil ? new Date(banUntil) : null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    return NextResponse.json({ success: true });
  }

  if (action === "unban") {
    await db
      .update(users)
      .set({ banned: false, bannedUntil: null, updatedAt: new Date() })
      .where(eq(users.id, userId));
    return NextResponse.json({ success: true });
  }

  if (action === "delete") {
    await db.delete(sessions).where(eq(sessions.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
