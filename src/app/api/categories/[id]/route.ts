import { NextRequest, NextResponse } from "next/server";
import * as categoriesRepo from "@/lib/repositories/categories";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { generateSlug } from "@/lib/slug";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function isAdmin(role: string | undefined) {
  return hasRole((role as "reader" | "publisher" | "admin") || "reader", "admin");
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const sessionRole = (session?.user as { role?: "reader" | "publisher" | "admin" } | undefined)?.role;
  if (!session?.user || !isAdmin(sessionRole)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const data: { name?: string; slug?: string; description?: string | null } = {};
  if (body.name !== undefined) {
    data.name = String(body.name).trim();
    data.slug = generateSlug(data.name);
  }
  if (body.description !== undefined) {
    data.description = body.description ? String(body.description) : null;
  }

  const category = await categoriesRepo.updateCategory(id, data);
  return NextResponse.json(category);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const sessionRole = (session?.user as { role?: "reader" | "publisher" | "admin" } | undefined)?.role;
  if (!session?.user || !isAdmin(sessionRole)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  await categoriesRepo.deleteCategory(id);
  return NextResponse.json({ success: true });
}
