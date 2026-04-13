import Link from "next/link";
import { Camera, Globe, MessageCircle } from "lucide-react";

const platforms = [
  { key: "instagram", icon: Camera, href: "#", color: "hover:text-pink-400 hover:border-pink-400/30 hover:bg-pink-400/10" },
  { key: "facebook", icon: Globe, href: "#", color: "hover:text-blue-400 hover:border-blue-400/30 hover:bg-blue-400/10" },
  { key: "x", icon: MessageCircle, href: "#", color: "hover:text-purple-400 hover:border-purple-400/30 hover:bg-purple-400/10" },
];

export default function SocialLinks() {
  return (
    <div className="flex items-center gap-3">
      {platforms.map(({ key, icon: Icon, href, color }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`p-2.5 rounded-lg bg-white/5 border border-white/10 transition-all duration-300 ${color}`}
          aria-label={key}
        >
          <Icon className="h-4 w-4 text-neutral-400" />
        </a>
      ))}
    </div>
  );
}
