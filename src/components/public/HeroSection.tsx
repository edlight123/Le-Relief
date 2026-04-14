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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-36 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] mb-6 sm:mb-8 animate-fade-in font-label">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Premium Journalism
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold tracking-tighter text-foreground animate-fade-in-up leading-[1.1] font-headline">
            Le Relief <span className="text-primary">Haïti</span>
          </h1>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-muted max-w-2xl mx-auto animate-fade-in-up animation-delay-200 leading-relaxed font-body">
            Votre source pour des nouvelles premium, des analyses approfondies et du contenu éditorial d&apos;Haïti et d&apos;ailleurs.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 animate-fade-in-up animation-delay-300">
            <Link
              href="/categories"
              className="group px-6 sm:px-8 py-3 sm:py-3.5 bg-primary text-white rounded-sm font-label text-xs sm:text-sm uppercase tracking-widest font-bold hover:brightness-110 transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
            >
              Explorer les Articles
              <span className="inline-block ml-1.5 transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
            </Link>
            <Link
              href="/about"
              className="px-6 sm:px-8 py-3 sm:py-3.5 border border-border-subtle text-foreground rounded-sm font-label text-xs sm:text-sm uppercase tracking-widest font-bold hover:bg-surface-elevated hover:border-muted/30 transition-all duration-300"
            >
              En Savoir Plus
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-4 sm:mt-8 mb-10 sm:mb-20">
        <Link href={`/articles/${article.slug}`} className="group block">
          <div className="relative overflow-hidden rounded-lg h-[320px] sm:h-[420px] md:h-[500px] lg:h-[600px]">
            {article.coverImage ? (
              <>
                <Image
                  src={article.coverImage}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-surface-elevated to-surface" />
            )}

            {/* Category Chip */}
            {article.category && (
              <div className="absolute top-4 left-4 sm:bottom-64 sm:top-auto sm:left-10 z-10">
                <span className="bg-primary text-white px-3 sm:px-4 py-1 font-label text-[10px] sm:text-xs tracking-widest uppercase">
                  {article.category.name}
                </span>
              </div>
            )}

            {/* Glass overlay content */}
            <div className="absolute bottom-4 sm:bottom-8 md:bottom-12 left-4 sm:left-6 md:left-10 right-4 sm:right-6 md:right-10 z-10 glass-overlay p-4 sm:p-6 md:p-10 lg:p-12 max-w-3xl rounded-sm">
              <h1 className="font-headline text-xl sm:text-2xl md:text-4xl lg:text-5xl text-foreground font-extrabold leading-tight tracking-tighter mb-2 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                {article.title}
              </h1>
              {article.excerpt && (
                <p className="hidden sm:block font-body text-muted text-sm sm:text-base md:text-lg max-w-2xl mb-4 sm:mb-6 line-clamp-2">
                  {article.excerpt}
                </p>
              )}
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                {article.author?.name && (
                  <div className="font-label text-[10px] sm:text-xs uppercase tracking-widest text-foreground/60">
                    Par {article.author.name}
                  </div>
                )}
                {article.author?.name && (
                  <div className="w-1 h-1 rounded-full bg-primary" />
                )}
                <div className="font-label text-[10px] sm:text-xs uppercase tracking-widest text-foreground/60">
                  {new Date().toLocaleDateString("fr-FR", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
