import Link from "next/link";
import Image from "next/image";
import { formatArticleDate, type Locale } from "@/lib/i18n";
import {
  formatHeadlineTypography,
  sanitizeExcerptText,
  shouldShowCardExcerpt,
} from "@/lib/content-format";

interface FeatureStory {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  coverImageFirebaseUrl?: string | null;
  publishedAt: Date | string | null;
  author?: { id?: string | null; name: string | null } | null;
  category?: { name: string; slug: string } | null;
  contentTypeLabel?: string;
  readingTime?: number;
  language?: "fr" | "en";
}

interface FeatureStoriesProps {
  stories: FeatureStory[];
  locale?: Locale;
  title?: string;
  kicker?: string;
}

/**
 * "À Suivre" (To Follow) section — 3-4 featured stories with visual prominence
 * Similar to EdLight's secondary story display
 */
export default function FeatureStories({
  stories,
  locale = "fr",
  title,
  kicker,
}: FeatureStoriesProps) {
  if (stories.length === 0) return null;

  const heading = title || (locale === "fr" ? "À suivre" : "To follow");
  const kickerLabel = kicker || (locale === "fr" ? "Sélection" : "Featured");

  return (
    <section aria-labelledby="feature-stories-heading">
      <div className="mb-6">
        <p className="section-kicker mb-2 tracking-[1px]">{kickerLabel}</p>
        <h2 className="font-headline text-3xl font-extrabold leading-none text-foreground sm:text-4xl">
          {heading}
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stories.slice(0, 4).map((story) => (
          <article key={story.id}>
            <Link
              href={`/${locale}/articles/${story.slug}`}
              className="group block overflow-hidden transition-transform hover:scale-[1.02]"
            >
              {/* Image */}
              {story.coverImageFirebaseUrl || story.coverImage ? (
                <div className="relative mb-3 aspect-video overflow-hidden bg-surface-elevated">
                  <Image
                    src={story.coverImageFirebaseUrl || story.coverImage || ""}
                    alt={story.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
              ) : (
                <div className="mb-3 aspect-video bg-surface-elevated" />
              )}

              {/* Category Badge */}
              {story.category && (
                <div className="mb-2">
                  <span className="font-label text-[11px] font-bold uppercase tracking-[1px] text-primary">
                    {story.category.name}
                  </span>
                </div>
              )}

              {/* Title */}
              <h3 className="mb-2 font-headline text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-lg">
                {formatHeadlineTypography(story.title)}
              </h3>

              {/* Excerpt */}
              {story.excerpt && shouldShowCardExcerpt(story.title, story.excerpt) && (
                <p className="mb-3 line-clamp-2 font-body text-sm leading-relaxed text-muted">
                  {sanitizeExcerptText(story.excerpt, {
                    authorName: story.author?.name,
                  })}
                </p>
              )}

              {/* Metadata: Date + Reading Time */}
              <div className="flex items-center gap-2 text-xs text-muted">
                {story.publishedAt && (
                  <time dateTime={new Date(story.publishedAt).toISOString()}>
                    {formatArticleDate(story.publishedAt, locale)}
                  </time>
                )}
                {story.readingTime && story.publishedAt && (
                  <span>·</span>
                )}
                {story.readingTime && (
                  <span>{story.readingTime} min</span>
                )}
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
