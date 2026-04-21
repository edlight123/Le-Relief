import SocialLinks from "@/components/public/SocialLinks";

export const metadata = {
  title: "Contact | Le Relief Haïti",
  description: "Contactez Le Relief Haïti",
};

export default function ContactPage() {
  return (
    <div className="newspaper-shell py-10 sm:py-14">
      <header className="mb-10 border-t-2 border-border-strong pt-5">
        <p className="page-kicker mb-3">Contact</p>
        <h1 className="editorial-title max-w-4xl text-5xl text-foreground sm:text-7xl">
          Contactez-nous
        </h1>
      </header>

      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="border-t border-border-strong pt-4">
          <h2 className="font-headline text-3xl font-extrabold text-foreground">
            Écrire à la rédaction
          </h2>
          <p className="mt-4 font-body text-lg leading-relaxed text-muted">
            Sujet à signaler, correction, partenariat, question éditoriale ou
            demande institutionnelle: indiquez clairement le contexte de votre
            message.
          </p>

          <div className="mt-8 border-t border-border-subtle pt-5">
            <h3 className="mb-2 font-label text-xs font-extrabold uppercase text-foreground">
              Renseignements généraux
            </h3>
            <a
              href="mailto:lereliefhaiti@gmail.com"
              className="ink-link font-body text-lg text-primary"
            >
              lereliefhaiti@gmail.com
            </a>
          </div>

          <div className="mt-8 border-t border-border-subtle pt-5">
            <h3 className="mb-2 font-label text-xs font-extrabold uppercase text-foreground">
              Partenariats
            </h3>
            <p className="font-body text-base leading-relaxed text-muted">
              Pour les collaborations éditoriales ou institutionnelles, précisez
              l&apos;organisation, l&apos;objet de la demande et le calendrier souhaité.
            </p>
          </div>

          <div className="mt-8 border-t border-border-subtle pt-5">
            <h2 className="mb-4 font-label text-xs font-extrabold uppercase text-foreground">
              Suivez-nous
            </h2>
            <SocialLinks />
          </div>
        </aside>

        <form
          action="/api/contact"
          method="post"
          className="space-y-5 border-t-2 border-border-strong pt-5"
        >
          <div>
            <label
              htmlFor="name"
              className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground"
            >
              Nom
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full border border-border-subtle bg-surface px-4 py-3 font-label text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground"
            >
              Courriel
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full border border-border-subtle bg-surface px-4 py-3 font-label text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="message"
              className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              required
              className="w-full resize-none border border-border-subtle bg-surface px-4 py-3 font-label text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="border border-border-strong bg-foreground px-6 py-3 font-label text-xs font-extrabold uppercase text-background transition-colors hover:bg-primary hover:text-white"
          >
            Envoyer le message
          </button>
        </form>
      </div>
    </div>
  );
}
