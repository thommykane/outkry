import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, sessions, moderators } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = "tjabate@gmail.com";

export async function GET(req: Request) {
  const sessionId = req.headers.get("cookie")?.match(/session=([^;]+)/)?.[1];
  if (!sessionId) {
    return NextResponse.json({ user: null });
  }

  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  if (!session || new Date(session.expiresAt) < new Date()) {
    return NextResponse.json({ user: null });
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) {
    return NextResponse.json({ user: null });
  }

  const [mod] = await db.select().from(moderators).where(eq(moderators.userId, user.id)).limit(1);
  const isModerator = !!mod;
  const isAdmin = user.isAdmin && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      isAdmin,
      isModerator,
    },
  });
}
