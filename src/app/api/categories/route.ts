import { NextRequest, NextResponse } from "next/server";
import * as categoriesRepo from "@/lib/repositories/categories";
import { auth } from "@/lib/auth";
import { generateSlug } from "@/lib/slug";
import { hasRole } from "@/lib/permissions";
import {
  type PublicCategory,
  normalizeCategory,
  sortCategories,
} from "@/lib/editorial";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawCategories = await categoriesRepo.getCategoriesWithCounts();
  const publicOnly = searchParams.get("public") === "true";

  if (!publicOnly) {
    return NextResponse.json({ categories: rawCategories });
  }

  const normalized = rawCategories
    .map((category) =>
      normalizeCategory(
        category,
        (category._count as { articles: number } | undefined)?.articles,
      ),
    )
    .filter((category): category is PublicCategory => category !== null);
  const deduped = new Map<string, PublicCategory>();
  for (const category of normalized) {
    const key = category.name.toLowerCase();
    const existing = deduped.get(key);
    if (!existing || (category.count || 0) > (existing.count || 0)) {
      deduped.set(key, category);
    }
  }
  const categories = sortCategories([...deduped.values()]);
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const sessionRole = (session?.user as { role?: "reader" | "publisher" | "admin" } | undefined)?.role;
  if (
    !session?.user ||
    !hasRole(
      sessionRole || "reader",
      "admin"
    )
  ) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const slug = generateSlug(body.name);

  const category = await categoriesRepo.createCategory({
    name: body.name,
    slug,
    description: body.description || null,
  });

  return NextResponse.json(category, { status: 201 });
}
