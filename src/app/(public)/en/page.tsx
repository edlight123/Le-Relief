import ArticleCard from "@/components/public/ArticleCard";
import NewsletterSignup from "@/components/public/NewsletterSignup";
import { getEnglishSelection } from "@/lib/public-content";

export const revalidate = 120;

export const metadata = {
  title: "English Selection | Le Relief",
  description:
    "Selected English articles from Le Relief, adapted from French reporting for international readers.",
  alternates: {
    canonical: "/en",
    languages: {
      fr: "/",
      en: "/en",
    },
  },
};

export default async function EnglishSelectionPage() {
  const articles = await getEnglishSelection();

  return (
    <div className="newspaper-shell py-10 sm:py-14">
      <header className="mb-10 border-t-2 border-border-strong pt-5">
        <p className="page-kicker mb-3">English</p>
        <h1 className="editorial-title max-w-4xl text-5xl text-foreground sm:text-7xl">
          Selected English coverage
        </h1>
        <p className="editorial-deck mt-4 max-w-2xl font-body text-xl">
          A focused selection of Le Relief reporting and analysis, edited for
          readers following Haiti from abroad.
        </p>
      </header>

      {articles.length > 0 ? (
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <section className="border-t border-border-subtle py-8">
          <p className="font-body text-lg leading-relaxed text-muted">
            The English selection will appear here as translated and reviewed
            articles are published.
          </p>
        </section>
      )}

      <section className="mt-14 border-t-2 border-border-strong pt-5">
        <p className="section-kicker mb-2">Newsletter</p>
        <h2 className="font-headline text-3xl font-extrabold leading-tight text-foreground">
          Follow the next edition.
        </h2>
        <p className="mt-3 max-w-2xl font-body text-lg leading-relaxed text-muted">
          Major stories, context and analysis from Le Relief.
        </p>
        <div className="mt-5 max-w-md">
          <NewsletterSignup />
        </div>
      </section>
    </div>
  );
}
