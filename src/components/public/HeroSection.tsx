import Link from "next/link";
import Image from "next/image";

interface HeroSectionProps {
  article?: {
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    category?: { name: string; slug: string } | null;
    author?: { name: string | null } | null;
  };
}

export default function HeroSection({ article }: HeroSectionProps) {
  if (!article) {
    return (
      <section className="bg-background py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="section-divider mx-auto mb-8 animate-fade-in" />
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground animate-fade-in-up leading-tight">
            Le Relief Haiti
          </h1>
          <p className="mt-6 text-lg text-muted max-w-xl mx-auto animate-fade-in-up animation-delay-200 leading-relaxed">
            Your source for premium news, in-depth analysis, and editorial content from Haiti and beyond.
          </p>
          <div className="mt-10 flex justify-center gap-4 animate-fade-in-up animation-delay-300">
            <Link
              href="/categories"
              className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-dark transition-colors duration-200"
            >
              Explore Articles
            </Link>
            <Link
              href="/about"
              className="px-6 py-3 border border-border-subtle text-foreground rounded-full font-medium hover:bg-surface-elevated transition-colors duration-200"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href={`/articles/${article.slug}`} className="group block">
          <div className="relative rounded-2xl overflow-hidden bg-surface-elevated">
            {article.coverImage ? (
              <div className="relative aspect-[21/9] md:aspect-[21/8]">
                <Image
                  src={article.coverImage}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                  {article.category && (
                    <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-semibold uppercase tracking-wider rounded-full mb-4">
                      {article.category.name}
                    </span>
                  )}
                  <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight max-w-3xl">
                    {article.title}
                  </h1>
                  {article.excerpt && (
                    <p className="mt-3 text-white/80 text-base md:text-lg max-w-2xl line-clamp-2">
                      {article.excerpt}
                    </p>
                  )}
                  {article.author?.name && (
                    <p className="mt-4 text-sm text-white/60">
                      By <span className="text-accent-amber font-medium">{article.author.name}</span>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 md:p-12">
                {article.category && (
                  <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-semibold uppercase tracking-wider rounded-full mb-4">
                    {article.category.name}
                  </span>
                )}
                <h1 className="text-2xl md:text-4xl font-bold text-foreground leading-tight max-w-3xl group-hover:text-primary transition-colors duration-200">
                  {article.title}
                </h1>
                {article.excerpt && (
                  <p className="mt-3 text-muted text-lg max-w-2xl line-clamp-2">
                    {article.excerpt}
                  </p>
                )}
              </div>
            )}
          </div>
        </Link>
      </div>
    </section>
  );
}
