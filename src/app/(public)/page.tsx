import Link from "next/link";
import HeroSection from "@/components/public/HeroSection";
import ArticleCard from "@/components/public/ArticleCard";
import CategoryGrid from "@/components/public/CategoryGrid";
import NewsletterSignup from "@/components/public/NewsletterSignup";
import { getHomepageContent } from "@/lib/public-content";

export const dynamic = "force-dynamic";

function SectionHeader({
  kicker,
  title,
  href,
}: {
  kicker: string;
  title: string;
  href?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between border-t-2 border-border-strong pt-3">
      <div>
        <p className="section-kicker mb-2">{kicker}</p>
        <h2 className="font-headline text-3xl font-extrabold leading-none text-foreground sm:text-4xl">
          {title}
        </h2>
      </div>
      {href ? (
        <Link
          href={href}
          className="hidden font-label text-xs font-extrabold uppercase text-foreground transition-colors hover:text-primary sm:block"
        >
          Tout voir
        </Link>
      ) : null}
    </div>
  );
}

export default async function HomePage() {
  const {
    hero,
    secondary,
    latest,
    editorial,
    mostRead,
    categories,
    englishSelection,
  } = await getHomepageContent();

  return (
    <>
      <HeroSection article={hero || undefined} />

      <div className="newspaper-shell">
        {secondary.length > 0 ? (
          <section className="mb-14 sm:mb-20">
            <SectionHeader kicker="À suivre" title="Les autres titres" />
            <div className="grid gap-7 md:grid-cols-3 md:gap-6">
              {secondary.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
          <div className="min-w-0">
            {latest.length > 0 ? (
              <section className="mb-14 sm:mb-20">
                <SectionHeader
                  kicker="Dernières nouvelles"
                  title="Le fil de la rédaction"
                  href="/categories"
                />
                <div className="divide-y divide-border-subtle border-t border-border-subtle">
                  {latest.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      variant="list"
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {editorial.length > 0 ? (
              <section className="mb-14 sm:mb-20">
                <SectionHeader
                  kicker="Contexte"
                  title="Analyses, opinions et dossiers"
                />
                <div className="grid gap-7 md:grid-cols-2">
                  {editorial.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            ) : null}

            {!hero && latest.length === 0 ? (
              <section className="border-t-2 border-border-strong py-16">
                <p className="page-kicker mb-3">Édition en préparation</p>
                <h2 className="font-headline text-4xl font-extrabold leading-tight text-foreground">
                  La rédaction n&apos;a pas encore publié d&apos;articles.
                </h2>
                <p className="mt-4 max-w-2xl font-body text-lg leading-relaxed text-muted">
                  Les articles publiés apparaîtront ici avec leur rubrique,
                  leur type de contenu et leur hiérarchie éditoriale.
                </p>
              </section>
            ) : null}
          </div>

          <aside className="space-y-10 lg:sticky lg:top-40 lg:h-fit">
            {mostRead.length > 0 ? (
              <section className="border-t-2 border-border-strong pt-4">
                <p className="section-kicker mb-2">Lecture</p>
                <h3 className="mb-4 font-headline text-2xl font-extrabold text-foreground">
                  Les plus lus
                </h3>
                <div className="divide-y divide-border-subtle">
                  {mostRead.map((article, index) => (
                    <Link
                      key={article.id}
                      href={`/articles/${article.slug}`}
                      className="group grid grid-cols-[2rem_1fr] gap-3 py-4"
                    >
                      <span className="font-label text-[10px] font-extrabold uppercase text-primary">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="font-headline text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                        {article.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {categories.length > 0 ? (
              <section className="border-t-2 border-border-strong pt-4">
                <div className="mb-5">
                  <p className="section-kicker mb-2">Rubriques</p>
                  <h3 className="font-headline text-2xl font-extrabold text-foreground">
                    Parcourir
                  </h3>
                </div>
                <CategoryGrid categories={categories} />
              </section>
            ) : null}

            <section className="border-t-2 border-border-strong pt-4">
              <p className="section-kicker mb-2">Lettre</p>
              <h3 className="font-headline text-2xl font-extrabold leading-tight text-foreground">
                Recevez les sujets qui comptent.
              </h3>
              <p className="mt-3 font-body text-base leading-relaxed text-muted">
                Une sélection claire des nouvelles, analyses et dossiers à lire.
              </p>
              <div className="mt-5">
                <NewsletterSignup />
              </div>
            </section>
          </aside>
        </div>
      </div>

      {categories.length > 0 ? (
        <section className="newspaper-shell mt-14 pb-16 sm:mt-20 sm:pb-20">
          <SectionHeader
            kicker="Taxonomie"
            title="Rubriques principales"
            href="/categories"
          />
          <CategoryGrid variant="grid" categories={categories} />
        </section>
      ) : null}

      {englishSelection.length > 0 ? (
        <section className="newspaper-shell pb-16 sm:pb-20">
          <SectionHeader
            kicker="English"
            title="Selected English coverage"
            href="/en"
          />
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-4">
            {englishSelection.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
