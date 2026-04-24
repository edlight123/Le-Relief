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
  /**
   * Additional href prefixes that should also activate this item.
   * Useful when the canonical new route and legacy route share active state.
   */
  alsoActiveFor?: string[];
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
        alsoActiveFor: ["/dashboard/my-drafts", "/dashboard"],
      },
      {
        label: "Nouvel article",
        href: "/admin/articles/new",
        icon: PenSquare,
        alsoActiveFor: ["/dashboard/articles/new"],
      },
      {
        label: "Mes brouillons",
        href: "/admin/drafts",
        icon: FileText,
        alsoActiveFor: ["/dashboard/my-drafts"],
      },
      {
        label: "Révisions demandées",
        href: "/admin/revisions",
        icon: RotateCcw,
        alsoActiveFor: ["/dashboard/revisions"],
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
        alsoActiveFor: ["/dashboard/review"],
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
        alsoActiveFor: ["/dashboard/articles"],
      },
      {
        label: "Publiés",
        href: "/admin/publishing/published",
        icon: Rocket,
        alsoActiveFor: ["/dashboard/published"],
      },
    ],
  },
];

const publisherNav: NavGroup[] = [
  {
    label: "Publication",
    items: [
      {
        label: "Tableau de publication",
        href: "/admin/publishing",
        icon: LayoutDashboard,
        alsoActiveFor: ["/dashboard/approved", "/dashboard/scheduled", "/dashboard/published"],
      },
      {
        label: "Prêts à publier",
        href: "/admin/publishing/ready",
        icon: CheckCircle2,
        alsoActiveFor: ["/dashboard/approved"],
      },
      {
        label: "Programmés",
        href: "/admin/publishing/scheduled",
        icon: CalendarClock,
        alsoActiveFor: ["/dashboard/scheduled"],
      },
      {
        label: "Publiés",
        href: "/admin/publishing/published",
        icon: Rocket,
        alsoActiveFor: ["/dashboard/published"],
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
        alsoActiveFor: ["/dashboard/homepage"],
      },
      {
        label: "Médiathèque",
        href: "/admin/media",
        icon: ImageIcon,
        alsoActiveFor: ["/dashboard/media"],
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
        alsoActiveFor: ["/dashboard"],
      },
      {
        label: "Articles",
        href: "/admin/articles",
        icon: FileText,
        alsoActiveFor: ["/dashboard/articles"],
      },
      {
        label: "Review Queue",
        href: "/admin/review",
        icon: ClipboardCheck,
        alsoActiveFor: ["/dashboard/review"],
      },
      {
        label: "Approuvés",
        href: "/admin/publishing/ready",
        icon: CheckCircle2,
        alsoActiveFor: ["/dashboard/approved"],
      },
      {
        label: "Programmés",
        href: "/admin/publishing/scheduled",
        icon: CalendarClock,
        alsoActiveFor: ["/dashboard/scheduled"],
      },
      {
        label: "Publiés",
        href: "/admin/publishing/published",
        icon: Rocket,
        alsoActiveFor: ["/dashboard/published"],
      },
      {
        label: "Une",
        href: "/admin/homepage",
        icon: Home,
        alsoActiveFor: ["/dashboard/homepage"],
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
      { label: "Analytiques", href: "/dashboard/analytics", icon: BarChart3 },
      { label: "Rapport éditorial", href: "/dashboard/editorial", icon: BarChart3 },
      { label: "Métriques produit", href: "/dashboard/product", icon: BarChart3 },
    ],
  },
  {
    label: "Gouvernance",
    items: [
      {
        label: "Auteurs",
        href: "/admin/authors",
        icon: UserCheck,
        alsoActiveFor: ["/dashboard/authors"],
      },
      {
        label: "Rubriques",
        href: "/admin/sections",
        icon: FolderTree,
        alsoActiveFor: ["/dashboard/categories"],
      },
      {
        label: "Médiathèque",
        href: "/admin/media",
        icon: ImageIcon,
        alsoActiveFor: ["/dashboard/media"],
      },
      {
        label: "Utilisateurs",
        href: "/admin/users",
        icon: Users,
        alsoActiveFor: ["/dashboard/users"],
      },
      {
        label: "Paramètres",
        href: "/admin/settings",
        icon: Settings,
        alsoActiveFor: ["/dashboard/settings"],
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
