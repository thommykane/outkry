import { notFound } from "next/navigation";
import { getCategoryById } from "@/lib/categories";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import CategoryContent from "@/components/CategoryContent";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: Props) {
  const { id } = await params;
  let categoryName: string;
  let rulesGuidelines: string | null = null;

  const staticCat = getCategoryById(id);
  if (staticCat) {
    categoryName = staticCat.child.name;
  } else {
    const [dbCat] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!dbCat) notFound();
    categoryName = dbCat.name;
    rulesGuidelines = dbCat.rulesGuidelines ?? null;
  }

  return <CategoryContent categoryId={id} categoryName={categoryName} rulesGuidelines={rulesGuidelines} />;
}
