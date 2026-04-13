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
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-surface-elevated">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(230,57,70,0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(42,157,143,0.05),transparent_50%)]" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-36 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-[0.2em] mb-8 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Premium Journalism
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground animate-fade-in-up leading-[1.1]">
            Le Relief <span className="text-primary">Haiti</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted max-w-2xl mx-auto animate-fade-in-up animation-delay-200 leading-relaxed">
            Your source for premium news, in-depth analysis, and editorial content from Haiti and beyond.
          </p>
          <div className="mt-10 flex justify-center gap-4 animate-fade-in-up animation-delay-300">
            <Link
              href="/categories"
              className="group px-8 py-3.5 bg-primary text-white rounded-full font-medium hover:bg-primary-dark transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
            >
              Explore Articles
              <span className="inline-block ml-1.5 transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
            </Link>
            <Link
              href="/about"
              className="px-8 py-3.5 border border-border-subtle text-foreground rounded-full font-medium hover:bg-surface-elevated hover:border-muted/30 transition-all duration-300"
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <Link href={`/articles/${article.slug}`} className="group block">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-surface-elevated to-surface border border-border-subtle shadow-sm hover:shadow-xl transition-shadow duration-500">
            {article.coverImage ? (
              <div className="relative aspect-[21/9] md:aspect-[21/8]">
                <Image
                  src={article.coverImage}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/5" />
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                  {article.category && (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/15 backdrop-blur-md text-white text-[11px] font-semibold uppercase tracking-[0.15em] rounded-full mb-5 border border-white/10">
                      <span className="w-1 h-1 rounded-full bg-primary" />
                      {article.category.name}
                    </span>
                  )}
                  <h1 className="text-2xl md:text-5xl font-bold text-white leading-[1.15] max-w-3xl">
                    {article.title}
                  </h1>
                  {article.excerpt && (
                    <p className="mt-4 text-white/70 text-base md:text-lg max-w-2xl line-clamp-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                  )}
                  {article.author?.name && (
                    <div className="mt-5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent-coral flex items-center justify-center text-white text-xs font-bold">
                        {article.author.name.charAt(0)}
                      </div>
                      <span className="text-sm text-white/60">
                        By <span className="text-white/90 font-medium">{article.author.name}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative p-10 md:p-14">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />
                {article.category && (
                  <span className="relative inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary/8 text-primary text-[11px] font-semibold uppercase tracking-[0.15em] rounded-full mb-6 border border-primary/15">
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    {article.category.name}
                  </span>
                )}
                <h1 className="relative text-3xl md:text-5xl font-bold text-foreground leading-[1.15] max-w-3xl group-hover:text-primary transition-colors duration-300">
                  {article.title}
                </h1>
                {article.excerpt && (
                  <p className="relative mt-4 text-muted text-lg max-w-2xl line-clamp-2 leading-relaxed">
                    {article.excerpt}
                  </p>
                )}
                {article.author?.name && (
                  <div className="relative mt-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent-coral flex items-center justify-center text-white text-xs font-bold">
                      {article.author.name.charAt(0)}
                    </div>
                    <span className="text-sm text-muted">
                      By <span className="text-foreground font-medium">{article.author.name}</span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Link>
      </div>
    </section>
  );
}
