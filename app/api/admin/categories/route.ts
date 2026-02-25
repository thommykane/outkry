import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { getAdminSessionForRead, requireAdmin } from "@/lib/admin";
import { v4 as uuid } from "uuid";

export async function GET() {
  const admin = await getAdminSessionForRead();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden", categories: [] }, { status: 403 });
  }

  const all = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));
  const allIds = new Set(all.map((c) => c.id));
  const parents = all.filter((c) => !c.parentId).sort((a, b) => a.name.localeCompare(b.name));
  const orphans = all.filter((c) => c.parentId && !allIds.has(c.parentId));
  const children = all.filter((c) => c.parentId);

  const tree = [
    ...parents.map((p) => ({
      ...p,
      children: children.filter((c) => c.parentId === p.id).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    })),
    ...orphans.map((o) => ({ ...o, children: [] })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ categories: tree });
}

export async function POST(req: NextRequest) {
  await requireAdmin();

  const body = await req.json();
  const { name, parentId, menuSection, defaultTab } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const id = parentId ? `${parentId}-${slug}` : slug;

  const [existing] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (existing) {
    return NextResponse.json({ error: "Category with that name already exists" }, { status: 400 });
  }

  const maxSort = await db.select({ max: categories.sortOrder }).from(categories).where(eq(categories.parentId, parentId ?? null));
  const sortOrder = (maxSort[0]?.max ?? -1) + 1;

  await db.insert(categories).values({
    id,
    slug,
    name: name.trim(),
    parentId: parentId || null,
    sortOrder,
    ...(parentId ? {} : { menuSection: (typeof menuSection === "string" && menuSection.trim()) ? menuSection.trim() : "discussion" }),
    defaultTab: defaultTab === "top" ? "top" : "recent",
  });

  return NextResponse.json({ success: true, id });
}

export async function PATCH(req: NextRequest) {
  await requireAdmin();

  const body = await req.json();

  // Reorder subcategories within a parent by id list (order = sortOrder 0, 1, 2, ...)
  const parentId = body.parentId;
  const subcategoryOrder = body.subcategoryOrder;
  if (parentId && Array.isArray(subcategoryOrder)) {
    const ids = subcategoryOrder as string[];
    const children = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.parentId, parentId));
    const validIds = new Set(children.map((c) => c.id));
    const orderedIds = ids.filter((id) => validIds.has(id));
    for (let i = 0; i < orderedIds.length; i++) {
      await db.update(categories).set({ sortOrder: i }).where(eq(categories.id, orderedIds[i]));
    }
    return NextResponse.json({ success: true });
  }

  // Update category name (id and slug stay the same)
  const categoryId = body.categoryId;
  const name = body.name;
  if (categoryId && typeof name === "string") {
    const trimmed = name.trim();
    if (!trimmed) return NextResponse.json({ error: "Name required" }, { status: 400 });
    const [cat] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
    if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    await db.update(categories).set({ name: trimmed }).where(eq(categories.id, categoryId));
    return NextResponse.json({ success: true });
  }

  // Update category rules & guidelines
  const rulesGuidelines = body.rulesGuidelines;
  if (categoryId && typeof rulesGuidelines === "string") {
    const [cat] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
    if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    await db.update(categories).set({ rulesGuidelines: rulesGuidelines || null }).where(eq(categories.id, categoryId));
    return NextResponse.json({ success: true });
  }

  // Update category menu section (parent categories only)
  const menuSection = body.menuSection;
  if (categoryId && typeof menuSection === "string" && menuSection.trim()) {
    const [cat] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
    if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    if (cat.parentId) return NextResponse.json({ error: "Only parent categories have sections" }, { status: 400 });
    await db.update(categories).set({ menuSection: menuSection.trim() }).where(eq(categories.id, categoryId));
    return NextResponse.json({ success: true });
  }

  // Update category default tab (recent | top)
  const defaultTab = body.defaultTab;
  if (categoryId && (defaultTab === "recent" || defaultTab === "top")) {
    const [cat] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
    if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    await db.update(categories).set({ defaultTab }).where(eq(categories.id, categoryId));
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid PATCH body" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const [cat] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!cat) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const children = await db.select().from(categories).where(eq(categories.parentId, id));
  if (children.length > 0) {
    return NextResponse.json({ error: "Delete subcategories first" }, { status: 400 });
  }

  await db.delete(categories).where(eq(categories.id, id));
  return NextResponse.json({ success: true });
}
