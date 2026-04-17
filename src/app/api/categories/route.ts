import { NextRequest, NextResponse } from "next/server";
import * as categoriesRepo from "@/lib/repositories/categories";
import { auth } from "@/lib/auth";
import { generateSlug } from "@/lib/slug";
import { hasRole } from "@/lib/permissions";

export async function GET() {
  const categories = await categoriesRepo.getCategoriesWithCounts();
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
