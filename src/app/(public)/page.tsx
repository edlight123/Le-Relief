import Link from "next/link";
import HeroSection from "@/components/public/HeroSection";
import ArticleCard from "@/components/public/ArticleCard";
import LatestArticlesFeed from "@/components/public/LatestArticlesFeed";
import FeatureStories from "@/components/public/FeatureStories";
import CategoryGrid from "@/components/public/CategoryGrid";
import NewsletterSignup from "@/components/public/NewsletterSignup";
import { getHomepageContent } from "@/lib/public-content";
import { formatHeadlineTypography } from "@/lib/content-format";

export const revalidate = 60;

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
        <p className="section-kicker mb-2 tracking-[1px]">{kicker}</p>
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
    showNewsletter,
  } = await getHomepageContent();

  return (
    <>
      <HeroSection article={hero || undefined} />

      <div className="newspaper-shell">
        {/* "À Suivre" - Secondary/Featured Stories Section */}
        {secondary.length > 0 ? (
          <section className="mb-14 border-b-4 border-border-strong pb-14 sm:mb-20 sm:pb-20">
            <FeatureStories
              stories={secondary}
              kicker="À la une"
              title="À suivre"
            />
          </section>
        ) : null}

        <div
          className={`grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12`}
        >
          <div className="min-w-0">
            {latest.length > 0 ? (
              <section className="mb-14 sm:mb-20">
                <SectionHeader
                  kicker="Dernières nouvelles"
                  title="Le fil de la rédaction"
                />
                <LatestArticlesFeed initialArticles={latest} />
              </section>
            ) : null}

            {editorial.length > 0 ? (
              <section className="mb-14 sm:mb-20">
                <SectionHeader
                  kicker="Contexte & analyse"
                  title="Analyses, opinions et dossiers"
                />
                <div>
                  {editorial.length > 0 ? (
                    <div className="mb-8 border-b border-border-subtle pb-8">
                      <ArticleCard article={editorial[0]} variant="list" />
                    </div>
                  ) : null}
                  {editorial.length > 1 ? (
                    <div className="grid gap-7 md:grid-cols-2">
                      {editorial.slice(1).map((article) => (
                        <ArticleCard key={article.id} article={article} />
                      ))}
                    </div>
                  ) : null}
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

          <aside className="space-y-10 border-t-4 border-border-strong pt-4 lg:sticky lg:top-40 lg:h-fit lg:bg-surface-newsprint lg:p-6 lg:pt-6">
            {mostRead.length > 0 ? (
              <section>
                <p className="section-kicker mb-2">Popularité</p>
                <h3 className="mb-5 font-headline text-2xl font-extrabold leading-none text-foreground">
                  Les plus lus
                </h3>
                <div className="divide-y divide-border-subtle">
                  {mostRead.map((article, index) => (
                    <Link
                      key={article.id}
                      href={`/articles/${article.slug}`}
                      className="group grid grid-cols-[3rem_1fr] gap-3 py-4"
                    >
                      <span className="editorial-numeral" style={{ fontSize: "1.75rem", color: "var(--border-subtle)" }}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="font-headline text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                        {formatHeadlineTypography(article.title)}
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

            {showNewsletter ? (
              <section className="border-t-2 border-border-strong pt-4">
                <p className="section-kicker mb-2">Lettre</p>
                <h3 className="font-headline text-2xl font-extrabold leading-tight text-foreground">
                  Recevez les sujets qui comptent.
                </h3>
                <p className="mt-3 font-body text-base leading-relaxed text-muted">
                  Une sélection claire des nouvelles, analyses et dossiers à lire.
                </p>
                <div className="mt-5">
                  <NewsletterSignup context="home-sidebar" />
                </div>
              </section>
            ) : null}
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

      {showNewsletter ? (
        <section className="mt-16 bg-foreground py-14 sm:mt-20 sm:py-20">
          <div className="newspaper-shell text-center">
            <p className="mb-4 font-label text-xs font-extrabold uppercase tracking-[1.2px] text-background/60">
              Lettre d&apos;information
            </p>
            <h2 className="font-headline text-3xl font-extrabold leading-tight text-background sm:text-4xl">
              Recevez Le Relief directement.
            </h2>
            <p className="mx-auto mt-4 max-w-md font-body text-base leading-relaxed text-background/70">
              Une sélection éditoriale de l&apos;actualité haïtienne, sans bruit.
            </p>
            <div className="mx-auto mt-8 max-w-sm">
              <NewsletterSignup context="home-hero" />
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
