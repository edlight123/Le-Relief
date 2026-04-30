import { NextResponse } from "next/server";

/**
 * Self-registration is disabled.
 * All accounts are pre-created by a superadmin.
 */
export async function POST() {
  return NextResponse.json(
    { error: "L'inscription publique est désactivée. Contactez un administrateur." },
    { status: 403 }
  );
}


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
