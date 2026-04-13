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
      <section className="relative bg-neutral-900 dark:bg-neutral-950 py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
            Le Relief
          </h1>
          <p className="mt-4 text-lg text-neutral-400 max-w-2xl mx-auto">
            Premium news and editorial content crafted for the modern reader.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-neutral-900 dark:bg-neutral-950 overflow-hidden">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-0 min-h-[480px]">
        <div className="flex flex-col justify-center px-8 md:px-16 py-16">
          {article.category && (
            <Link
              href={`/categories/${article.category.slug}`}
              className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-4 hover:text-blue-300 transition-colors"
            >
              {article.category.name}
            </Link>
          )}
          <Link href={`/articles/${article.slug}`}>
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight hover:text-neutral-200 transition-colors">
              {article.title}
            </h1>
          </Link>
          {article.excerpt && (
            <p className="mt-4 text-neutral-400 text-lg leading-relaxed line-clamp-3">
              {article.excerpt}
            </p>
          )}
          {article.author?.name && (
            <p className="mt-6 text-sm text-neutral-500">
              By {article.author.name}
            </p>
          )}
        </div>
        {article.coverImage && (
          <div className="relative h-64 lg:h-auto">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
      </div>
    </section>
  );
}
