import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import * as usersRepo from "@/lib/repositories/users";
import { signupSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existing = await usersRepo.findByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "Cette adresse courriel est déjà utilisée" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await usersRepo.createUser({
      name,
      email,
      hashedPassword,
      role: "writer",
    });

    return NextResponse.json(
      { id: user.id, name: user.name, email: user.email },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
