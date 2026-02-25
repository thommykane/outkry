import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = "tjabate@gmail.com";

export async function requireAdmin() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;
  if (!sessionId) redirect("/login");

  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  if (!session || new Date(session.expiresAt) < new Date()) redirect("/login");

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user || !user.isAdmin || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    redirect("/");
  }

  return { user, session };
}

/** Returns admin session or null without redirecting. Use in API routes that should return JSON (e.g. 403) instead of redirect. */
export async function getAdminSession(): Promise<{ user: typeof users.$inferSelect; session: typeof sessions.$inferSelect } | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;
  if (!sessionId) return null;

  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  if (!session || new Date(session.expiresAt) < new Date()) return null;

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user || !user.isAdmin || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return null;

  return { user, session };
}

/** Returns session + user if logged in and user.isAdmin. No email check. Use for read-only admin APIs (e.g. list categories) so any admin can load data. */
export async function getAdminSessionForRead(): Promise<{ user: typeof users.$inferSelect; session: typeof sessions.$inferSelect } | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;
  if (!sessionId) return null;

  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  if (!session || new Date(session.expiresAt) < new Date()) return null;

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user || !user.isAdmin) return null;

  return { user, session };
}
