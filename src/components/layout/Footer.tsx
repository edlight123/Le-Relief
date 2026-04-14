import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site.config";
import SocialLinks from "@/components/public/SocialLinks";

export default function Footer() {
  return (
    <footer className="bg-foreground dark:bg-[#0A0A0A] mt-12 sm:mt-20 pt-12 sm:pt-24 pb-8 sm:pb-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 w-full text-background font-label text-sm uppercase tracking-widest">
        {/* Brand */}
        <div className="col-span-1">
          <div className="flex items-center gap-2.5 mb-6">
            <Image
              src="/logo.png"
              alt="Le Relief"
              width={28}
              height={28}
              className="rounded-full"
              unoptimized
            />
            <div className="text-2xl font-black text-background font-headline italic">
              {siteConfig.name}
            </div>
          </div>
          <p className="normal-case tracking-normal opacity-60 leading-relaxed max-w-xs font-body mb-8 text-background/80">
            {siteConfig.description}. Delivering depth and clarity with premium journalism.
          </p>
          <SocialLinks />
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-4">
          <h4 className="font-bold border-b border-background/10 pb-4 mb-2">Navigation</h4>
          {siteConfig.nav.public.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-background/50 hover:text-background hover:underline decoration-primary decoration-2 underline-offset-4 transition-all"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Legal */}
        <div className="flex flex-col gap-4">
          <h4 className="font-bold border-b border-background/10 pb-4 mb-2">Légal</h4>
          <Link
            href="/privacy"
            className="text-background/50 hover:text-background hover:underline decoration-primary decoration-2 underline-offset-4 transition-all"
          >
            Confidentialité
          </Link>
          <Link
            href="/contact"
            className="text-background/50 hover:text-background hover:underline decoration-primary decoration-2 underline-offset-4 transition-all"
          >
            Contact
          </Link>
          <Link
            href="/about"
            className="text-background/50 hover:text-background hover:underline decoration-primary decoration-2 underline-offset-4 transition-all"
          >
            À Propos
          </Link>
        </div>

        {/* Newsletter */}
        <div className="flex flex-col gap-6">
          <h4 className="font-bold border-b border-background/10 pb-4 mb-2">Restez Connecté</h4>
          <p className="normal-case tracking-normal font-body text-xs text-background/50">
            Rejoignez nos abonnés pour des analyses éditoriales hebdomadaires.
          </p>
          <div className="relative">
            <input
              className="w-full bg-background/5 border-0 border-b-2 border-background/20 focus:border-primary transition-colors py-2 px-0 text-background placeholder:text-background/30 font-body lowercase tracking-normal"
              placeholder="Adresse email"
              type="email"
            />
            <button className="absolute right-0 top-1/2 -translate-y-1/2 text-primary hover:text-background transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Copyright */}
        <div className="col-span-full mt-12 pt-12 border-t border-background/10 text-center">
          <p className="text-[10px] text-background/30">
            &copy; {new Date().getFullYear()} {siteConfig.name}. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
