import { expect, test, type Browser, type Page } from "@playwright/test";

type AppRole = "writer" | "editor" | "publisher" | "admin";

async function withRolePage(
  browser: Browser,
  role: AppRole,
  callback: (page: Page) => Promise<void>,
) {
  const context = await browser.newContext({
    baseURL: "http://localhost:3000",
    extraHTTPHeaders: {
      "x-test-role": role,
    },
  });

  const page = await context.newPage();

  try {
    await callback(page);
  } finally {
    await context.close();
  }
}

test.describe("QA role matrix", () => {
  test("writer smoke path and visibility", async ({ browser }) => {
    await withRolePage(browser, "writer", async (page) => {
      await page.goto("/admin");
      await expect(page).toHaveURL(/\/admin\/workspace$/);
      const nav = page.getByRole("navigation");

      await expect(nav.getByRole("link", { name: "Espace de travail" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Mes brouillons" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Révisions demandées" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Soumis" })).toBeVisible();

      await expect(nav.getByRole("link", { name: "Utilisateurs" })).toHaveCount(0);
      await expect(nav.getByRole("link", { name: "Paramètres" })).toHaveCount(0);
      await expect(nav.getByRole("link", { name: "Une" })).toHaveCount(0);
    });
  });

  test("editor smoke path and visibility", async ({ browser }) => {
    await withRolePage(browser, "editor", async (page) => {
      await page.goto("/admin");
      await expect(page).toHaveURL(/\/admin\/review$/);
      const nav = page.getByRole("navigation");

      await expect(nav.getByRole("link", { name: "Review Queue" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Besoin d'attention" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Révisions demandées" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Tous les articles" })).toBeVisible();

      await expect(nav.getByRole("link", { name: "Utilisateurs" })).toHaveCount(0);
      await expect(nav.getByRole("link", { name: "Paramètres" })).toHaveCount(0);
    });
  });

  test("publisher smoke path and visibility", async ({ browser }) => {
    await withRolePage(browser, "publisher", async (page) => {
      await page.goto("/admin");
      await expect(page).toHaveURL(/\/admin\/publishing$/);
      const nav = page.getByRole("navigation");

      await expect(nav.getByRole("link", { name: "Tableau de publication" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Prêts à publier" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Programmés" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Publiés" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Une" })).toBeVisible();

      await expect(nav.getByRole("link", { name: "Utilisateurs" })).toHaveCount(0);
      await expect(nav.getByRole("link", { name: "Paramètres" })).toHaveCount(0);
    });
  });

  test("admin smoke path and visibility", async ({ browser }) => {
    await withRolePage(browser, "admin", async (page) => {
      await page.goto("/admin");
      await expect(page).toHaveURL(/\/admin\/dashboard$/);
      const nav = page.getByRole("navigation");

      await expect(nav.getByRole("link", { name: "Tableau de bord" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Articles", exact: true })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Review Queue" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Approuvés" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Utilisateurs" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Paramètres" })).toBeVisible();
    });
  });

  const routeChecks: Record<AppRole, { allowed: string[]; denied: string[] }> = {
    writer: {
      allowed: ["/admin/workspace", "/admin/drafts", "/admin/revisions", "/admin/submitted"],
      denied: ["/admin/dashboard", "/admin/review", "/admin/publishing", "/admin/users"],
    },
    editor: {
      allowed: ["/admin/review", "/admin/review/attention", "/admin/revisions", "/admin/articles"],
      denied: ["/admin/dashboard", "/admin/workspace", "/admin/publishing", "/admin/settings"],
    },
    publisher: {
      allowed: [
        "/admin/publishing",
        "/admin/publishing/ready",
        "/admin/publishing/scheduled",
        "/admin/homepage",
      ],
      denied: ["/admin/dashboard", "/admin/workspace", "/admin/review", "/admin/users"],
    },
    admin: {
      allowed: ["/admin/dashboard", "/admin/users", "/admin/settings", "/admin/audit"],
      denied: [],
    },
  };

  for (const role of ["writer", "editor", "publisher", "admin"] as const) {
    test(`route protection matrix for ${role}`, async ({ browser }) => {
      await withRolePage(browser, role, async (page) => {
        for (const route of routeChecks[role].allowed) {
          await page.goto(route, { waitUntil: "domcontentloaded" });
          await expect(page).not.toHaveURL(/\/admin\/access-denied$/);
          await expect(page).not.toHaveURL(/\/login$/);
        }

        for (const route of routeChecks[role].denied) {
          await page.goto(route, { waitUntil: "domcontentloaded" });
          await expect(page).toHaveURL(/\/admin\/access-denied$/);
          await expect(page.getByRole("heading", { name: "Accès refusé" })).toBeVisible();
        }
      });
    });
  }

  test("legacy dashboard aliases still resolve", async ({ browser }) => {
    await withRolePage(browser, "writer", async (page) => {
      await page.goto("/dashboard/my-drafts");
      await expect(page).toHaveURL(/\/dashboard\/my-drafts$/);

      await page.goto("/dashboard/revisions");
      await expect(page).toHaveURL(/\/dashboard\/revisions$/);
    });

    await withRolePage(browser, "editor", async (page) => {
      await page.goto("/dashboard/review");
      await expect(page).toHaveURL(/\/dashboard\/review$/);
    });

    await withRolePage(browser, "publisher", async (page) => {
      await page.goto("/dashboard/approved");
      await expect(page).toHaveURL(/\/dashboard\/approved$/);
      await page.goto("/dashboard/scheduled");
      await expect(page).toHaveURL(/\/dashboard\/scheduled$/);
      await page.goto("/dashboard/published");
      await expect(page).toHaveURL(/\/dashboard\/published$/);
    });
  });
});
