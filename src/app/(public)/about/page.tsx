import { siteConfig } from "@/config/site.config";

export const metadata = {
  title: "About | Le Relief Haiti",
  description: "Learn about Le Relief Haiti and our mission",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight animate-fade-in-up">
        About {siteConfig.name}
      </h1>

      <div className="mt-4 h-px bg-gradient-to-r from-primary/60 via-accent-rose/20 to-transparent" />

      <div className="mt-8 prose prose-lg dark:prose-invert max-w-none">
        <p>
          Le Relief Haiti is a premium digital news and editorial platform dedicated
          to delivering high-quality, trustworthy journalism to a global
          audience.
        </p>

        <h2>Our Mission</h2>
        <p>
          We believe that quality reporting matters. Our mission is to provide
          readers with well-researched, beautifully presented news and editorial
          content that informs, inspires, and empowers.
        </p>

        <h2>Editorial Principles</h2>
        <p>
          Every article published on Le Relief Haiti is reviewed for accuracy,
          clarity, and editorial integrity. We are committed to fair,
          independent journalism that serves the public interest.
        </p>

        <h2>Trust &amp; Credibility</h2>
        <p>
          Le Relief Haiti is built on a foundation of trust. We maintain strict
          editorial standards and are transparent about our processes,
          sources, and editorial decisions.
        </p>

        <h2>Our Platform</h2>
        <p>
          We combine the experience of a polished public news website with the
          internal power of a professional newsroom workspace, ensuring both
          readers and publishers get a premium experience.
        </p>
      </div>
    </div>
  );
}
