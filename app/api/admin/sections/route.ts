import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { menuSections, categories } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { v4 as uuid } from "uuid";

export async function GET() {
  await requireAdmin();
  const sections = await db.select().from(menuSections).orderBy(asc(menuSections.sortOrder), asc(menuSections.id));
  return NextResponse.json({ sections });
}

export async function POST(req: NextRequest) {
  await requireAdmin();

  const body = await req.json();
  const { name } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  let id = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 50) || "section";
  const [existing] = await db.select().from(menuSections).where(eq(menuSections.id, id)).limit(1);
  if (existing) id = `section-${uuid().slice(0, 8)}`;

  const [maxSort] = await db.select({ max: menuSections.sortOrder }).from(menuSections);
  const sortOrder = (maxSort?.max ?? -1) + 1;

  await db.insert(menuSections).values({
    id,
    name: name.trim(),
    sortOrder,
  });

  return NextResponse.json({ success: true, id });
}

export async function PATCH(req: NextRequest) {
  await requireAdmin();

  const body = await req.json();
  const { sectionId, name, sortOrder } = body;

  if (!sectionId) {
    return NextResponse.json({ error: "sectionId required" }, { status: 400 });
  }

  const [section] = await db.select().from(menuSections).where(eq(menuSections.id, sectionId)).limit(1);
  if (!section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof name === "string" && name.trim()) updates.name = name.trim();
  if (typeof sortOrder === "number") updates.sortOrder = sortOrder;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await db.update(menuSections).set(updates as Record<string, string | number>).where(eq(menuSections.id, sectionId));
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const [section] = await db.select().from(menuSections).where(eq(menuSections.id, id)).limit(1);
  if (!section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  const parentsInSection = await db.select().from(categories).where(eq(categories.menuSection, id));
  if (parentsInSection.length > 0) {
    return NextResponse.json(
      { error: `Move or delete the ${parentsInSection.length} category(ies) under this section first` },
      { status: 400 }
    );
  }

  await db.delete(menuSections).where(eq(menuSections.id, id));
  return NextResponse.json({ success: true });
}
