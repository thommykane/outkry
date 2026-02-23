import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";

const ADMIN_EMAIL = "tjabate@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, phone, username, password, bio } = body;

    if (!email || !phone || !username || !password) {
      return NextResponse.json(
        { error: "Email, phone, username and password required" },
        { status: 400 }
      );
    }

    const [existingEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingEmail) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const [existingUser] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existingUser) {
      return NextResponse.json({ error: "Username taken" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuid();

    await db.insert(users).values({
      id: userId,
      email,
      phone,
      username: username.trim(),
      passwordHash,
      bio: bio?.trim() || null,
      emailVerified: false,
      phoneVerified: false,
      isAdmin: email.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
    });

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
    const sessionId = uuid();
    await db.insert(sessions).values({
      id: sessionId,
      userId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ipAddress,
    });

    const res = NextResponse.json({ success: true, userId });
    res.cookies.set("session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
