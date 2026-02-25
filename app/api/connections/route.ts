import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userConnections, users, posts, sessions } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get("session")?.value;
  if (!sessionId) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  if (!session || new Date(session.expiresAt) < new Date())
    return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const forUserId = searchParams.get("userId");
  const mode = searchParams.get("mode"); // "list" | "posts" | "check"
  const checkConnectedUserId = searchParams.get("checkConnectedUserId"); // for mode=check: is current user connected to this user?
  const userId = forUserId ?? session.userId;

  if (mode === "check" && checkConnectedUserId) {
    const [row] = await db
      .select()
      .from(userConnections)
      .where(
        and(
          eq(userConnections.userId, session.userId),
          eq(userConnections.connectedUserId, checkConnectedUserId)
        )
      )
      .limit(1);
    return NextResponse.json({ connected: !!row });
  }

  if (mode === "list") {
    const conns = await db
      .select({
        connectedUserId: userConnections.connectedUserId,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(userConnections)
      .innerJoin(users, eq(userConnections.connectedUserId, users.id))
      .where(eq(userConnections.userId, userId));
    return NextResponse.json({ connections: conns });
  }
  if (mode === "posts") {
    if (userId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const conns = await db
      .select({ connectedUserId: userConnections.connectedUserId })
      .from(userConnections)
      .where(eq(userConnections.userId, session.userId));
    const connectedIds = conns.map((c) => c.connectedUserId);
    if (connectedIds.length === 0) return NextResponse.json({ posts: [] });
    const postsList = await db
      .select()
      .from(posts)
      .where(inArray(posts.authorId, connectedIds))
      .orderBy(desc(posts.createdAt))
      .limit(100);
    const postsWithAuthor = await Promise.all(
      postsList.map(async (p) => {
        const [author] = await db.select().from(users).where(eq(users.id, p.authorId)).limit(1);
        return {
          ...p,
          author: author ? { username: author.username, avatarUrl: author.avatarUrl } : null,
        };
      })
    );
    return NextResponse.json({ posts: postsWithAuthor });
  }
  return NextResponse.json({ error: "mode required" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get("session")?.value;
  if (!sessionId) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  if (!session || new Date(session.expiresAt) < new Date())
    return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const connectedUserId = body.connectedUserId;
  const action = body.action; // "connect" | "disconnect"
  if (!connectedUserId || !action) return NextResponse.json({ error: "connectedUserId and action required" }, { status: 400 });
  if (connectedUserId === session.userId) return NextResponse.json({ error: "Cannot connect to yourself" }, { status: 400 });

  const [target] = await db.select().from(users).where(eq(users.id, connectedUserId)).limit(1);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (action === "connect") {
    await db
      .insert(userConnections)
      .values({ userId: session.userId, connectedUserId })
      .onConflictDoNothing();
    return NextResponse.json({ connected: true });
  }
  if (action === "disconnect") {
    await db
      .delete(userConnections)
      .where(and(eq(userConnections.userId, session.userId), eq(userConnections.connectedUserId, connectedUserId)));
    return NextResponse.json({ connected: false });
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
