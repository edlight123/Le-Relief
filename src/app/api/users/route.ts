import { NextRequest, NextResponse } from "next/server";
import * as usersRepo from "@/lib/repositories/users";
import { auth } from "@/lib/auth";

export async function GET() {
  const users = await usersRepo.getUsers();
  return NextResponse.json({ users });
}
