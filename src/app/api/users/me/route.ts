import { NextRequest, NextResponse } from "next/server";
import * as usersRepo from "@/lib/repositories/users";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const user = await usersRepo.getUser(session.user.id);
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;

  const user = await usersRepo.updateUser(session.user.id, data);
  return NextResponse.json(user);
}
