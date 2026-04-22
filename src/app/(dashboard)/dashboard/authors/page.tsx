"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import FilterBar, { FilterBarSection } from "@/components/ui/FilterBar";
import EmptyState from "@/components/ui/EmptyState";
import UserRoleBadge from "@/components/ui/UserRoleBadge";
import { Users, FileText, Search } from "lucide-react";

interface Author {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image?: string | null;
  bio?: string | null;
  roleFr?: string | null;
  createdAt?: string;
  articleCount?: number;
}

const NEWSROOM_ROLES = ["writer", "editor", "publisher", "admin"];

function Avatar({ author }: { author: Author }) {
  const initials = (author.name || author.email)
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (author.image) {
    return (
      <Image
        src={author.image}
        alt={author.name || "Auteur"}
        width={40}
        height={40}
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-label text-sm font-bold text-primary">
      {initials}
    </div>
  );
}

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        const users: Author[] = (data.users || []).filter((u: Author) =>
          NEWSROOM_ROLES.includes(u.role),
        );
        setAuthors(users);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? authors.filter(
        (a) =>
          (a.name || "").toLowerCase().includes(search.toLowerCase()) ||
          a.email.toLowerCase().includes(search.toLowerCase()),
      )
    : authors;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Équipe"
        title="Auteurs"
        description="Membres de la rédaction, profils institutionnels et accès liés à la production éditoriale."
        actions={
          <Link
            href="/dashboard/users"
            className="rounded-sm border border-border-subtle px-3 py-2 font-label text-xs font-bold text-muted transition-colors hover:text-foreground"
          >
            Gérer les accès
          </Link>
        }
      />

      <FilterBar>
        <FilterBarSection className="min-w-0 flex-1 max-w-sm">
          <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            type="search"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-sm border border-border-subtle bg-surface py-2 pl-9 pr-3 font-label text-sm text-foreground placeholder-muted focus:border-primary focus:outline-none"
          />
          </div>
        </FilterBarSection>
        <FilterBarSection>
          <span className="font-label text-xs uppercase text-muted">
            {loading ? "—" : filtered.length} membre{filtered.length !== 1 ? "s" : ""}
          </span>
        </FilterBarSection>
      </FilterBar>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse border border-border-subtle bg-surface" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun auteur trouvé"
          description="Affinez la recherche ou ouvrez la gestion des utilisateurs pour ajouter un nouveau profil."
          actionHref="/dashboard/users"
          actionLabel="Ouvrir les utilisateurs"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((author) => (
            <Card key={author.id}>
              <div className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <Avatar author={author} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-headline text-base font-extrabold text-foreground truncate">
                        {author.name || author.email}
                      </h3>
                      <UserRoleBadge role={author.role} />
                    </div>
                    <p className="mt-0.5 font-label text-xs text-muted truncate">
                      {author.email}
                    </p>
                    {author.roleFr ? (
                      <p className="mt-1 font-label text-[11px] uppercase text-muted">{author.roleFr}</p>
                    ) : null}
                    {author.bio && (
                      <p className="mt-2 line-clamp-2 font-body text-xs text-muted">
                        {author.bio}
                      </p>
                    )}
                    {author.articleCount != null && (
                      <p className="mt-2 flex items-center gap-1 font-label text-[10px] text-muted">
                        <FileText className="h-3 w-3" />
                        {author.articleCount} article{author.articleCount !== 1 ? "s" : ""} publiés
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex gap-2 border-t border-border-subtle pt-3">
                  <Link
                    href={`/dashboard/users`}
                    className="font-label text-xs text-primary hover:underline"
                  >
                    Modifier le rôle
                  </Link>
                  <span className="text-border-subtle">·</span>
                  <Link
                    href={`/dashboard/articles?authorId=${author.id}`}
                    className="font-label text-xs text-muted hover:text-foreground"
                  >
                    Voir les articles
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
