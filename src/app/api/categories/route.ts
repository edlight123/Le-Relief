import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateSlug } from "@/lib/slug";

export async function GET() {
  const categories = await db.category.findMany({
    include: { _count: { select: { articles: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const slug = generateSlug(body.name);

  const category = await db.category.create({
    data: {
      name: body.name,
      slug,
      description: body.description || null,
    },
  });

  return NextResponse.json(category, { status: 201 });
}
