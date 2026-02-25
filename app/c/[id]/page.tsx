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
  if (id === "all-main-page") {
    return (
      <CategoryContent
        categoryId="all-main-page"
        categoryName="Main"
        rulesGuidelines={null}
        defaultTab="recent"
        isMainPage
      />
    );
  }

  if (id === "all-random") {
    return (
      <CategoryContent
        categoryId="all-random"
        categoryName="Random"
        rulesGuidelines={null}
        defaultTab="recent"
        isRandomPage
      />
    );
  }

  let categoryName: string;
  let rulesGuidelines: string | null = null;
  let defaultTab: "recent" | "top" = "recent";

  const staticCat = getCategoryById(id);
  if (staticCat) {
    categoryName = staticCat.child.name;
  } else {
    const [dbCat] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!dbCat) notFound();
    categoryName = dbCat.name;
    rulesGuidelines = dbCat.rulesGuidelines ?? null;
    if (dbCat.defaultTab === "top" || dbCat.defaultTab === "recent") defaultTab = dbCat.defaultTab;
  }

  return (
    <CategoryContent
      categoryId={id}
      categoryName={categoryName}
      rulesGuidelines={rulesGuidelines}
      defaultTab={defaultTab}
    />
  );
}
