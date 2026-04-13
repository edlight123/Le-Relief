import { siteConfig } from "@/config/site.config";
import SocialLinks from "@/components/public/SocialLinks";

export const metadata = {
  title: "Contact | Le Relief Haïti",
  description: "Contactez Le Relief Haïti",
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight animate-fade-in-up">
        Contactez-nous
      </h1>

      <div className="section-divider mt-3 mb-8" />

      <div className="mt-8 space-y-10">
        {/* Contact Info */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Entrer en Contact
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Vous avez un sujet d&apos;article, une question éditoriale ou commerciale ? Nous
            serions ravis de vous entendre.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">
              Renseignements Généraux
            </h3>
            <a
              href="mailto:lereliefhaiti@gmail.com"
              className="text-primary hover:text-primary-light transition-colors duration-300"
            >
              lereliefhaiti@gmail.com
            </a>
          </div>
        </div>

        {/* Contact Form */}
        <form
          action="/api/contact"
          method="POST"
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
            >
              Nom
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full rounded-lg border border-border-subtle bg-surface text-foreground px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
            >
              Courriel
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full rounded-lg border border-border-subtle bg-surface text-foreground px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              required
              className="w-full rounded-lg border border-border-subtle bg-surface text-foreground px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary text-white rounded-full font-medium text-sm hover:bg-primary-dark transition-colors duration-200"
          >
            Envoyer le Message
          </button>
        </form>

        {/* Social */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Suivez-nous
          </h2>
          <SocialLinks />
        </div>
      </div>
    </div>
  );
}
