import { NextRequest, NextResponse } from "next/server";
import * as usersRepo from "@/lib/repositories/users";
import { auth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.role !== undefined) data.role = body.role;

  const user = await usersRepo.updateUser(id, data);
  return NextResponse.json(user);
}
