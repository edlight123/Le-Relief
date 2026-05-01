import {
  LayoutDashboard,
  Home,
  FileText,
  FolderTree,
  PenSquare,
  ClipboardCheck,
  RotateCcw,
  CalendarClock,
  CheckCircle2,
  Image as ImageIcon,
  BarChart3,
  Settings,
  Users,
  UserCheck,
  AlertCircle,
  Newspaper,
  SendHorizonal,
  Rocket,
  Share2,
  type LucideIcon,
} from "lucide-react";
import type { AppRole } from "@/lib/role-routing";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Match exact path only — use for root routes like /dashboard */
  exact?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

const writerNav: NavGroup[] = [
  {
    label: "Ma rédaction",
    items: [
      {
        label: "Espace de travail",
        href: "/admin/workspace",
        icon: Newspaper,
      },
      {
        label: "Nouvel article",
        href: "/admin/articles/new",
        icon: PenSquare,
      },
      {
        label: "Mes brouillons",
        href: "/admin/drafts",
        icon: FileText,
      },
      {
        label: "Révisions demandées",
        href: "/admin/revisions",
        icon: RotateCcw,
      },
      { label: "Soumis", href: "/admin/submitted", icon: SendHorizonal },
    ],
  },
];

const editorNav: NavGroup[] = [
  {
    label: "Review",
    items: [
      {
        label: "Review Queue",
        href: "/admin/review",
        icon: ClipboardCheck,
      },
      {
        label: "Besoin d'attention",
        href: "/admin/review/attention",
        icon: AlertCircle,
      },
      { label: "Révisions demandées", href: "/admin/revisions", icon: RotateCcw },
    ],
  },
  {
    label: "Contenu",
    items: [
      {
        label: "Tous les articles",
        href: "/admin/articles",
        icon: FileText,
      },
      {
        label: "Publiés",
        href: "/admin/publishing/published",
        icon: Rocket,
      },
    ],
  },
];

const publisherNav: NavGroup[] = [
  {
    label: "Rédaction",
    items: [
      { label: "Espace de travail", href: "/admin/workspace", icon: Newspaper },
      { label: "Nouvel article", href: "/admin/articles/new", icon: PenSquare },
      { label: "Mes brouillons", href: "/admin/drafts", icon: FileText },
      { label: "Révisions demandées", href: "/admin/revisions", icon: RotateCcw },
      { label: "Soumis", href: "/admin/submitted", icon: SendHorizonal },
    ],
  },
  {
    label: "Review",
    items: [
      { label: "Review Queue", href: "/admin/review", icon: ClipboardCheck },
      { label: "Besoin d'attention", href: "/admin/review/attention", icon: AlertCircle },
      { label: "Tous les articles", href: "/admin/articles", icon: FileText },
    ],
  },
  {
    label: "Publication",
    items: [
      {
        label: "Tableau de publication",
        href: "/admin/publishing",
        icon: LayoutDashboard,
      },
      {
        label: "Prêts à publier",
        href: "/admin/publishing/ready",
        icon: CheckCircle2,
      },
      {
        label: "Programmés",
        href: "/admin/publishing/scheduled",
        icon: CalendarClock,
      },
      {
        label: "Publiés",
        href: "/admin/publishing/published",
        icon: Rocket,
      },
    ],
  },
  {
    label: "Éditorial",
    items: [
      {
        label: "Une",
        href: "/admin/homepage",
        icon: Home,
      },
      {
        label: "Médiathèque",
        href: "/admin/media",
        icon: ImageIcon,
      },
      {
        label: "Réseaux sociaux",
        href: "/admin/social",
        icon: Share2,
      },
    ],
  },
];

const adminNav: NavGroup[] = [
  {
    label: "Newsroom",
    items: [
      {
        label: "Tableau de bord",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
      {
        label: "Nouvel article",
        href: "/admin/articles/new",
        icon: PenSquare,
      },
      {
        label: "Espace de travail",
        href: "/admin/workspace",
        icon: Newspaper,
      },
      {
        label: "Articles",
        href: "/admin/articles",
        icon: FileText,
      },
      {
        label: "Review Queue",
        href: "/admin/review",
        icon: ClipboardCheck,
      },
      {
        label: "Approuvés",
        href: "/admin/publishing/ready",
        icon: CheckCircle2,
      },
      {
        label: "Programmés",
        href: "/admin/publishing/scheduled",
        icon: CalendarClock,
      },
      {
        label: "Publiés",
        href: "/admin/publishing/published",
        icon: Rocket,
      },
      {
        label: "Une",
        href: "/admin/homepage",
        icon: Home,
      },
      {
        label: "Réseaux sociaux",
        href: "/admin/social",
        icon: Share2,
      },
    ],
  },
  {
    label: "Analyse",
    items: [
      { label: "Analytiques", href: "/admin/analytics", icon: BarChart3 },
      { label: "Rapport éditorial", href: "/admin/editorial", icon: BarChart3 },
      { label: "Métriques produit", href: "/admin/product", icon: BarChart3 },
    ],
  },
  {
    label: "Gouvernance",
    items: [
      {
        label: "Auteurs",
        href: "/admin/authors",
        icon: UserCheck,
      },
      {
        label: "Rubriques",
        href: "/admin/sections",
        icon: FolderTree,
      },
      {
        label: "Médiathèque",
        href: "/admin/media",
        icon: ImageIcon,
      },
      {
        label: "Utilisateurs",
        href: "/admin/users",
        icon: Users,
      },
      {
        label: "Paramètres",
        href: "/admin/settings",
        icon: Settings,
      },
      { label: "Journal d'audit", href: "/admin/audit", icon: BarChart3 },
    ],
  },
];

export const NAV_BY_ROLE: Record<AppRole, NavGroup[]> = {
  writer: writerNav,
  editor: editorNav,
  publisher: publisherNav,
  admin: adminNav,
};

export const ROLE_LABEL: Record<AppRole, string> = {
  writer: "Rédaction",
  editor: "Édition",
  publisher: "Publication",
  admin: "Administration",
};