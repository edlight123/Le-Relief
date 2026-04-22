import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import * as homepageRepo from "@/lib/repositories/homepage";
import { homepageSettingsSchema } from "@/lib/validation";
import type { Role } from "@/types/user";
import { logEditorialEvent } from "@/lib/repositories/editorial/audit";

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

    const secondaryIds = parsed.data.secondaryArticleIds || [];
    const duplicateCount = secondaryIds.length - new Set(secondaryIds).size;
    if (duplicateCount > 0) {
      return NextResponse.json(
        { error: "Un article ne peut pas occuper plusieurs slots secondaires." },
        { status: 400 },
      );
    }

    if (parsed.data.heroArticleId && secondaryIds.includes(parsed.data.heroArticleId)) {
      return NextResponse.json(
        { error: "L'article hero ne peut pas être réutilisé en secondaire." },
        { status: 400 },
      );
    }

    const settings = await homepageRepo.updateHomepageSettings({
      heroArticleId: parsed.data.heroArticleId || null,
      secondaryArticleIds: secondaryIds,
      highlightedCategoryIds: parsed.data.highlightedCategoryIds || [],
      showNewsletter: parsed.data.showNewsletter ?? true,
      showEnglishSelection: parsed.data.showEnglishSelection ?? true,
    });

    await logEditorialEvent({
      articleId: parsed.data.heroArticleId || "homepage",
      actorId: user.id,
      type: "homepage_assigned",
      note: "Configuration homepage mise à jour",
      metadata: {
        heroArticleId: parsed.data.heroArticleId || null,
        secondaryArticleIds: secondaryIds,
      },
    });

    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json(
      { error: "Impossible d'enregistrer la une" },
      { status: 500 },
    );
  }
}
