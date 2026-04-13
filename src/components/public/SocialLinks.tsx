import Link from "next/link";
import { Camera, Globe, MessageCircle } from "lucide-react";

const platforms = [
  { key: "instagram", icon: Camera, href: "#" },
  { key: "facebook", icon: Globe, href: "#" },
  { key: "x", icon: MessageCircle, href: "#" },
];

export default function SocialLinks() {
  return (
    <div className="flex items-center gap-3">
      {platforms.map(({ key, icon: Icon, href }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
          aria-label={key}
        >
          <Icon className="h-4 w-4 text-neutral-300" />
        </a>
      ))}
    </div>
  );
}
