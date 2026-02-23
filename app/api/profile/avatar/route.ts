import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";
import { uploadToFtp, isFtpConfigured } from "@/lib/ftp-upload";
import { uploadToBlob, isBlobConfigured } from "@/lib/blob-upload";

export async function PATCH(req: NextRequest) {
  const sessionId = req.cookies.get("session")?.value;
  if (!sessionId) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  if (!session || new Date(session.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "Avatar file required" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name) || ".jpg";
  const filename = `${uuid()}${ext}`;
  let avatarUrl: string;
  if (isBlobConfigured()) {
    avatarUrl = await uploadToBlob(buffer, `uploads/avatars/${filename}`);
  } else if (isFtpConfigured()) {
    avatarUrl = await uploadToFtp(buffer, filename, "avatars");
  } else {
    const dir = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(dir, { recursive: true });
    const filepath = path.join(dir, filename);
    await writeFile(filepath, buffer);
    avatarUrl = `/uploads/avatars/${filename}`;
  }

  await db
    .update(users)
    .set({ avatarUrl, updatedAt: new Date() })
    .where(eq(users.id, session.userId));

  return NextResponse.json({ avatarUrl });
}
