import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { announcements } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { v4 as uuid } from "uuid";

export async function GET() {
  await requireAdmin();
  const all = await db.select().from(announcements).orderBy(desc(announcements.createdAt));
  return NextResponse.json({ announcements: all });
}

export async function POST(req: NextRequest) {
  const { user } = await requireAdmin();

  const body = await req.json();
  const { title, body: bodyText } = body;

  if (!title?.trim() || !bodyText?.trim()) {
    return NextResponse.json({ error: "title and body required" }, { status: 400 });
  }

  const id = uuid();
  await db.insert(announcements).values({
    id,
    title: title.trim(),
    body: bodyText.trim(),
    createdById: user.id,
    active: true,
  });

  return NextResponse.json({ success: true, id });
}

export async function DELETE(req: NextRequest) {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await db.delete(announcements).where(eq(announcements.id, id));
  return NextResponse.json({ success: true });
}
