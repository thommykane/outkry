import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { menuSections } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

const FALLBACK_SECTIONS = [
  { id: "discussion", name: "Discussion Board", sortOrder: 0 },
  { id: "image", name: "Image Board", sortOrder: 1 },
];

export async function GET() {
  try {
    let sections = await db.select().from(menuSections).orderBy(asc(menuSections.sortOrder), asc(menuSections.id));

    if (sections.length === 0) {
      await db.insert(menuSections).values(FALLBACK_SECTIONS);
      sections = await db.select().from(menuSections).orderBy(asc(menuSections.sortOrder), asc(menuSections.id));
    }

    return NextResponse.json({ sections });
  } catch (err) {
    console.error("[api/menu-sections]", err);
    return NextResponse.json({ sections: FALLBACK_SECTIONS });
  }
}
