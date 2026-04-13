import { siteConfig } from "@/config/site.config";
import SocialLinks from "@/components/public/SocialLinks";

export const metadata = {
  title: "Contact | Le Relief Haiti",
  description: "Get in touch with Le Relief Haiti",
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight animate-fade-in-up">
        Contact Us
      </h1>

      <div className="mt-4 h-px bg-gradient-to-r from-primary/60 via-accent-rose/20 to-transparent" />

      <div className="mt-8 space-y-10">
        {/* Contact Info */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Reach Out
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Have a story tip, editorial inquiry, or business question? We would
            love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">
              General Inquiries
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
              Name
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
              Email
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
            className="px-6 py-2.5 bg-gradient-to-r from-primary to-accent-rose text-white rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all duration-300"
          >
            Send Message
          </button>
        </form>

        {/* Social */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Follow Us
          </h2>
          <SocialLinks />
        </div>
      </div>
    </div>
  );
}
