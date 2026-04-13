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
      <section className="relative bg-black py-36 px-4 overflow-hidden">
        {/* Decorative gradient orbs */}
        <div className="gradient-orb w-96 h-96 bg-purple-600 top-[-10%] left-[-5%]" />
        <div className="gradient-orb w-80 h-80 bg-pink-500 bottom-[-15%] right-[10%]" />
        <div className="gradient-orb w-64 h-64 bg-teal-400 top-[20%] right-[-5%] opacity-10" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6 animate-fade-in">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent-rose">
              <span className="text-sm">✦</span> Premium Editorial <span className="text-sm">✦</span>
            </span>
            <div className="mt-3 h-0.5 w-16 mx-auto bg-gradient-to-r from-primary via-accent-rose to-accent-teal animate-line-expand rounded-full" />
          </div>
          <h1 className="text-5xl md:text-8xl font-bold tracking-tight animate-fade-in-up gradient-text">
            Le Relief Haiti
          </h1>
          <p className="mt-8 text-lg md:text-xl text-neutral-300 max-w-2xl mx-auto animate-fade-in-up animation-delay-200 leading-relaxed">
            Premium news and editorial content crafted for the{" "}
            <span className="shimmer-text font-semibold">modern reader</span>.
          </p>
          <div className="mt-10 flex justify-center gap-4 animate-fade-in-up animation-delay-400">
            <Link
              href="/categories"
              className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
            >
              Explore Articles
            </Link>
            <Link
              href="/about"
              className="px-6 py-3 border border-white/20 text-white rounded-xl font-medium hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-black overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="gradient-orb w-96 h-96 bg-purple-600 bottom-0 left-[-5%]" />
      <div className="gradient-orb w-64 h-64 bg-pink-500 top-0 right-[20%] opacity-10" />

      <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-0 min-h-[540px]">
        <div className="flex flex-col justify-center px-8 md:px-16 py-20">
          {article.category && (
            <Link
              href={`/categories/${article.category.slug}`}
              className="inline-flex items-center gap-2 self-start mb-5 animate-fade-in"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-accent-teal animate-pulse-glow" />
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent-teal hover:text-accent-teal-light transition-colors">
                {article.category.name}
              </span>
            </Link>
          )}
          <Link href={`/articles/${article.slug}`}>
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-[1.15] animate-fade-in-up hover:text-primary-light transition-colors duration-500">
              {article.title}
            </h1>
          </Link>
          {article.excerpt && (
            <p className="mt-5 text-neutral-300/80 text-lg leading-relaxed line-clamp-3 animate-fade-in-up animation-delay-200">
              {article.excerpt}
            </p>
          )}
          {article.author?.name && (
            <div className="mt-8 flex items-center gap-3 animate-fade-in-up animation-delay-300">
              <div className="h-px w-8 bg-gradient-to-r from-primary to-accent-rose" />
              <p className="text-sm text-neutral-400 tracking-wide">
                By <span className="text-accent-rose font-medium">{article.author.name}</span>
              </p>
            </div>
          )}
          <div className="mt-8 animate-fade-in-up animation-delay-400">
            <Link
              href={`/articles/${article.slug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-all duration-300 shadow-lg shadow-primary/25 hover:-translate-y-0.5"
            >
              Read Article
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </div>
        {article.coverImage && (
          <div className="relative h-72 lg:h-auto animate-fade-in animation-delay-300">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
            {/* Colorful overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent lg:block hidden" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}
      </div>
    </section>
  );
}
