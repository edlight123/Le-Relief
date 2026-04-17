import { NextResponse } from "next/server";
import * as usersRepo from "@/lib/repositories/users";

export async function GET() {
  const users = await usersRepo.getUsers();
  return NextResponse.json({ users });
}
