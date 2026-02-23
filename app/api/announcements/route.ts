import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { announcements } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const all = await db
    .select()
    .from(announcements)
    .where(eq(announcements.active, true))
    .orderBy(desc(announcements.createdAt));
  return NextResponse.json({ announcements: all });
}
