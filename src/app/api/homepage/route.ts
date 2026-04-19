import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import * as homepageRepo from "@/lib/repositories/homepage";
import { homepageSettingsSchema } from "@/lib/validation";
import type { Role } from "@/types/user";

function getSessionUser(session: unknown) {
  return (session as { user?: { id?: string; role?: Role } } | null)?.user;
}

export async function GET() {
  const session = await auth();
  const user = getSessionUser(session);
  if (!user?.id || !hasRole(user.role || "reader", "publisher")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const settings = await homepageRepo.getHomepageSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(req: Request) {
  const session = await auth();
  const user = getSessionUser(session);
  if (!user?.id || !hasRole(user.role || "reader", "publisher")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = homepageSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Configuration invalide" },
        { status: 400 },
      );
    }

    const settings = await homepageRepo.updateHomepageSettings({
      heroArticleId: parsed.data.heroArticleId || null,
      secondaryArticleIds: parsed.data.secondaryArticleIds || [],
      highlightedCategoryIds: parsed.data.highlightedCategoryIds || [],
      showNewsletter: parsed.data.showNewsletter ?? true,
      showEnglishSelection: parsed.data.showEnglishSelection ?? true,
    });

    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json(
      { error: "Impossible d'enregistrer la une" },
      { status: 500 },
    );
  }
}
