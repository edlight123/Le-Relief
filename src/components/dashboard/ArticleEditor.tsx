"use client";

import Link from "next/link";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown, ChevronUp, Check, X, CircleDot,
  Tag, Globe, SearchCode, GitBranch, ShieldCheck,
  Image as ImageIcon, Monitor, Smartphone, Share2,
  Newspaper, Clock, Zap, BookOpen, ArrowUpRight, AlignLeft,
} from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import MediaUploader from "@/components/dashboard/MediaUploader";
import SourceArticlePicker from "@/components/dashboard/SourceArticlePicker";
import Badge from "@/components/ui/Badge";
import AlertBanner from "@/components/ui/AlertBanner";
import StatusChip from "@/components/ui/StatusChip";
import PriorityFlag from "@/components/ui/PriorityFlag";
import { canTransitionStatus, normalizeWorkflowRole } from "@/lib/editorial-workflow";
import { useSession } from "next-auth/react";
import CommentsPanel from "@/components/dashboard/editorial/CommentsPanel";
import HistoryPanel from "@/components/dashboard/editorial/HistoryPanel";
import NovelEditor from "@/components/dashboard/NovelEditor";

type TranslationLink = {
  id: string;
  title: string;
  slug?: string;
};

type SourceArticleLink = {
  id: string;
  title: string;
  slug?: string;
};

interface ArticleEditorProps {
  initial?: {
    id?: string;
    title: string;
    subtitle: string;
    body: string;
    excerpt: string;
    coverImage: string;
    coverImageCaption?: string;
    categoryId: string;
    tags: string[];
    status: string;
    contentType?: string;
    language?: string;
    translationStatus?: string;
    sourceArticleId?: string;
    sourceArticle?: SourceArticleLink | null;
    translations?: TranslationLink[];
    alternateLanguageSlug?: string;
    allowTranslation?: boolean;
    translationPriority?: string;
    scheduledAt?: string;
    priorityLevel?: string;
    isBreaking?: boolean;
    isHomepagePinned?: boolean;
    correction?: string;
    correctionDate?: string;
    slug?: string;
    seoTitle?: string;
    metaDescription?: string;
    authorId?: string;
    coAuthors?: string[];
    assignedTo?: string;
  };
  categories: { id: string; name: string }[];
  onSubmit: (data: {
    title: string;
    subtitle: string;
    body: string;
    excerpt: string;
    coverImage: string;
    coverImageCaption: string;
    categoryId: string;
    tags: string[];
    status: string;
    contentType: string;
    language: string;
    translationStatus: string;
    sourceArticleId: string;
    alternateLanguageSlug: string;
    allowTranslation: boolean;
    translationPriority: string;
    scheduledAt: string;
    priorityLevel: string;
    isBreaking: boolean;
    isHomepagePinned: boolean;
    correction: string;
    correctionDate: string;
    slug: string;
    seoTitle: string;
    metaDescription: string;
    coAuthors: string[];
    assignedTo: string;
  }) => Promise<void>;
  submitLabel?: string;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  workflow: <Clock className="h-3.5 w-3.5" />,
  metadata: <Tag className="h-3.5 w-3.5" />,
  seo: <SearchCode className="h-3.5 w-3.5" />,
  translation: <Globe className="h-3.5 w-3.5" />,
  quality: <ShieldCheck className="h-3.5 w-3.5" />,
  correction: <BookOpen className="h-3.5 w-3.5" />,
};

function EditorSection({
  title,
  id,
  open,
  onToggle,
  children,
}: {
  title: string;
  id?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const icon = id ? SECTION_ICONS[id] : null;
  return (
    <section id={id} className="scroll-mt-28 overflow-hidden border border-border-subtle bg-surface">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-surface-elevated"
      >
        <span className="flex items-center gap-2 font-label text-sm font-extrabold uppercase tracking-wide text-foreground">
          {icon && <span className="text-muted">{icon}</span>}
          {title}
        </span>
        <span className={`transition-transform duration-200 ${open ? "rotate-0" : "-rotate-90"}`}>
          <ChevronDown className="h-4 w-4 text-muted" />
        </span>
      </button>
      {open ? (
        <div className="space-y-4 border-t border-border-subtle px-4 py-5">
          {children}
        </div>
      ) : null}
    </section>
  );
}

export default function ArticleEditor({
  initial,
  categories,
  onSubmit,
  submitLabel = "Publier",
}: ArticleEditorProps) {
  const isExistingArticle = Boolean(initial?.id);
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;
  const role = normalizeWorkflowRole((session?.user as { role?: string } | undefined)?.role || "writer");
  const isOwner = isExistingArticle ? initial?.authorId === currentUserId : true;
  const [title, setTitle] = useState(initial?.title || "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle || "");
  const [body, setBody] = useState(initial?.body || "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt || "");
  const [coverImage, setCoverImage] = useState(initial?.coverImage || "");
  const [coverImageCaption, setCoverImageCaption] = useState(initial?.coverImageCaption || "");
  const [scheduledAt, setScheduledAt] = useState(initial?.scheduledAt || "");
  const [priorityLevel, setPriorityLevel] = useState(initial?.priorityLevel || "");
  const [isBreaking, setIsBreaking] = useState(Boolean(initial?.isBreaking));
  const [isHomepagePinned, setIsHomepagePinned] = useState(Boolean(initial?.isHomepagePinned));
  const [correction, setCorrection] = useState(initial?.correction || "");
  const [correctionDate, setCorrectionDate] = useState(initial?.correctionDate || "");
  const [status, setStatus] = useState(initial?.status || "draft");
  const [categoryId, setCategoryId] = useState(initial?.categoryId || "");
  const [contentType, setContentType] = useState(initial?.contentType || "actualite");
  const [language, setLanguage] = useState(initial?.language || "fr");
  const [translationStatus, setTranslationStatus] = useState(
    initial?.translationStatus || (initial?.language === "en" ? "not_started" : "not_applicable"),
  );
  const [sourceArticleId, setSourceArticleId] = useState(initial?.sourceArticleId || "");
  const [sourceArticlePreview, setSourceArticlePreview] = useState<SourceArticleLink | null>(
    initial?.sourceArticle || null,
  );
  const [alternateLanguageSlug, setAlternateLanguageSlug] = useState(
    initial?.alternateLanguageSlug || "",
  );
  const [allowTranslation, setAllowTranslation] = useState(
    initial?.allowTranslation || false,
  );
  const [translationPriority, setTranslationPriority] = useState(
    initial?.translationPriority || "",
  );
  const [slug, setSlug] = useState(initial?.slug || "");
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle || "");
  const [metaDescription, setMetaDescription] = useState(initial?.metaDescription || "");
  const [coAuthorsInput, setCoAuthorsInput] = useState((initial?.coAuthors || []).join(", "));
  const [assignedTo, setAssignedTo] = useState(initial?.assignedTo || "");
  const [staffUsers, setStaffUsers] = useState<{ id: string; name: unknown; role: unknown }[]>([]);
  const [sourceError, setSourceError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [tagsInput, setTagsInput] = useState((initial?.tags || []).join(", "));
  const [saving, setSaving] = useState(false);
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile" | "social">("desktop");
  const [openSections, setOpenSections] = useState(() => ({
    workflow: true,
    metadata: true,
    seo: true,
    translation: role !== "writer",
    quality: true,
    correction: false,
  }));
  const lastAutosavedPayloadRef = useRef<string>("");
  const autosaveTimerRef = useRef<number | null>(null);

  const tags = useMemo(
    () =>
      tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tagsInput],
  );

  const payloadForSave = useMemo(
    () => ({
      title,
      subtitle,
      body,
      excerpt,
      coverImage,
      coverImageCaption,
      categoryId,
      tags,
      status,
      contentType,
      language,
      translationStatus,
      sourceArticleId,
      alternateLanguageSlug,
      allowTranslation,
      translationPriority,
      scheduledAt,
      priorityLevel,
      isBreaking,
      isHomepagePinned,
      correction,
      correctionDate,
      slug,
      seoTitle,
      metaDescription,
      coAuthors: coAuthorsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      assignedTo,
    }),
    [
      title,
      subtitle,
      body,
      excerpt,
      coverImage,
      coverImageCaption,
      categoryId,
      tags,
      status,
      contentType,
      language,
      translationStatus,
      sourceArticleId,
      alternateLanguageSlug,
      allowTranslation,
      translationPriority,
      scheduledAt,
      priorityLevel,
      isBreaking,
      isHomepagePinned,
      correction,
      correctionDate,
      slug,
      seoTitle,
      metaDescription,
      coAuthorsInput,
      assignedTo,
    ],
  );

  const autosavePayload = useMemo(() => JSON.stringify(payloadForSave), [payloadForSave]);

  const persistAutosave = useCallback(async () => {
    if (autosavePayload === lastAutosavedPayloadRef.current) return;
    setAutosaveState("saving");

    try {
      if (isExistingArticle && initial?.id) {
        const res = await fetch(`/api/articles/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: autosavePayload,
        });
        if (!res.ok) {
          throw new Error("Autosave failed");
        }
      } else if (typeof window !== "undefined") {
        window.localStorage.setItem("le-relief:editor-draft", autosavePayload);
      }

      lastAutosavedPayloadRef.current = autosavePayload;
      setAutosaveState("saved");
    } catch {
      setAutosaveState("error");
    }
  }, [autosavePayload, initial, isExistingArticle]);

  useEffect(() => {
    if (role === "writer") return;
    fetch("/api/users")
      .then((r) => r.json())
      .then((data: { id: string; name: unknown; role: unknown }[]) => setStaffUsers(Array.isArray(data) ? data : []))
      .catch(() => undefined);
  }, [role]);

  useEffect(() => {
    if (isExistingArticle || typeof window === "undefined") return;
    const raw = window.localStorage.getItem("le-relief:editor-draft");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<typeof payloadForSave>;
      startTransition(() => {
        if (parsed.title && !title) setTitle(parsed.title);
        if (parsed.subtitle && !subtitle) setSubtitle(parsed.subtitle);
        if (parsed.body && !body) setBody(parsed.body);
        if (parsed.excerpt && !excerpt) setExcerpt(parsed.excerpt);
        if (parsed.coverImage && !coverImage) setCoverImage(parsed.coverImage);
        if (parsed.coverImageCaption && !coverImageCaption) setCoverImageCaption(parsed.coverImageCaption);
        if (parsed.categoryId && !categoryId) setCategoryId(parsed.categoryId);
        if (parsed.contentType && !contentType) setContentType(parsed.contentType);
        if (parsed.language && !language) setLanguage(parsed.language);
        if (parsed.translationStatus && !translationStatus) setTranslationStatus(parsed.translationStatus);
        if (parsed.sourceArticleId && !sourceArticleId) setSourceArticleId(parsed.sourceArticleId);
        if (parsed.alternateLanguageSlug && !alternateLanguageSlug) setAlternateLanguageSlug(parsed.alternateLanguageSlug);
        if (parsed.translationPriority && !translationPriority) setTranslationPriority(parsed.translationPriority);
        if (parsed.priorityLevel && !priorityLevel) setPriorityLevel(parsed.priorityLevel);
        if (typeof parsed.isBreaking === "boolean") setIsBreaking(parsed.isBreaking);
        if (typeof parsed.isHomepagePinned === "boolean") setIsHomepagePinned(parsed.isHomepagePinned);
        if (parsed.slug && !slug) setSlug(parsed.slug);
        if (parsed.seoTitle && !seoTitle) setSeoTitle(parsed.seoTitle);
        if (parsed.metaDescription && !metaDescription) setMetaDescription(parsed.metaDescription);
        if (Array.isArray(parsed.tags) && tagsInput.length === 0) {
          setTagsInput(parsed.tags.join(", "));
        }
      });
    } catch {
      // ignore invalid local draft
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      void persistAutosave();
    }, 1200);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [persistAutosave]);

  async function handleSubmit(status: string) {
    setSubmitError("");
    setSourceError("");

    if (language === "en" && !sourceArticleId) {
      const message = "Veuillez sélectionner un article source FR pour une version EN.";
      setSourceError(message);
      if (typeof window !== "undefined") {
        window.alert(message);
      }
      return;
    }

    setSaving(true);
    try {
      await onSubmit({ ...payloadForSave, status });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec de la validation de traduction.";
      setSubmitError(message);
      setSourceError(message.toLowerCase().includes("source") ? message : sourceError);
    } finally {
      setSaving(false);
    }
  }

  const translations = initial?.translations || [];
  const normalizedStatus = status === "pending_review" ? "in_review" : status;
  const statusVariant: "default" | "success" | "warning" | "danger" | "info" =
    translationStatus === "published" || translationStatus === "approved"
      ? "success"
      : translationStatus === "in_review" || translationStatus === "generated_draft"
      ? "warning"
      : translationStatus === "rejected"
      ? "danger"
      : "default";

  const qualityChecks = useMemo(
    () => [
      { label: "Titre", ok: Boolean(title.trim()) },
      { label: "Chapô", ok: Boolean(excerpt.trim()) },
      { label: "Corps", ok: Boolean(body.trim()) },
      { label: "Rubrique", ok: Boolean(categoryId) },
      { label: "Type", ok: Boolean(contentType) },
      { label: "Image principale", ok: Boolean(coverImage) },
      { label: "Slug", ok: Boolean((slug || title).trim()) },
      { label: "SEO title", ok: Boolean((seoTitle || title).trim()) },
      { label: "Meta description", ok: Boolean((metaDescription || excerpt).trim()) },
    ],
    [body, categoryId, contentType, coverImage, excerpt, metaDescription, seoTitle, slug, title],
  );

  const completionScore = Math.round(
    (qualityChecks.filter((check) => check.ok).length / qualityChecks.length) * 100,
  );
  const missingChecks = qualityChecks.filter((check) => !check.ok);

  const completionVariant = completionScore >= 90 ? "success" : completionScore >= 70 ? "info" : "warning";
  const statusOptions = [
    { value: "draft", label: "Brouillon" },
    { value: "writing", label: "En rédaction" },
    { value: "in_review", label: "Soumis à relecture" },
    { value: "revisions_requested", label: "Révisions demandées" },
    { value: "approved", label: "Approuvé" },
    { value: "scheduled", label: "Programmé" },
    { value: "published", label: "Publié" },
    { value: "rejected", label: "Rejeté" },
    { value: "archived", label: "Archivé" },
  ];

  const canApprove = canTransitionStatus({
    role,
    fromStatus: status,
    toStatus: "approved",
    isOwner,
  }).allowed;
  const canPublish = canTransitionStatus({
    role,
    fromStatus: status,
    toStatus: "published",
    isOwner,
  }).allowed;
  const canRequestReview = canTransitionStatus({
    role,
    fromStatus: status,
    toStatus: "in_review",
    isOwner,
  }).allowed;
  const canSaveDraft = canTransitionStatus({
    role,
    fromStatus: status,
    toStatus: "draft",
    isOwner,
  }).allowed;

  const autosaveLabel =
    autosaveState === "saved"
      ? "Sauvegardé"
      : autosaveState === "saving"
      ? "Enregistrement…"
      : autosaveState === "error"
      ? "Erreur autosave"
      : "Prêt";

  function toggleSection(section: keyof typeof openSections) {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  }

  function scrollToSection(sectionId: string) {
    if (typeof document === "undefined") return;
    const section = document.getElementById(sectionId);
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function uploadFile(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    return data.url;
  }

  return (
    <div className="space-y-8 pt-1">
      {/* ── Masthead ──────────────────────────────────────────────────────── */}
      <div className="border border-border-subtle bg-surface">
        {/* Top meta bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-6 py-3">
          <div className="flex items-center gap-2">
            <Newspaper className="h-3.5 w-3.5 text-muted" />
            <span className="font-label text-[11px] font-extrabold uppercase tracking-[0.22em] text-muted">
              Le Relief · Édition
            </span>
            {role === "writer" && <span className="ml-2 font-label text-[11px] uppercase tracking-wide text-muted">— Mode rédaction</span>}
            {role === "editor" && <span className="ml-2 font-label text-[11px] uppercase tracking-wide text-accent-blue">— Révision éditoriale</span>}
            {role === "publisher" && <span className="ml-2 font-label text-[11px] uppercase tracking-wide text-accent-amber">— Publication</span>}
            {role === "admin" && <span className="ml-2 font-label text-[11px] uppercase tracking-wide text-accent-coral">— Administration</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isBreaking ? <PriorityFlag kind="breaking" /> : null}
            {isHomepagePinned ? <PriorityFlag kind="homepage" /> : null}
            <StatusChip status={normalizedStatus} />
            <Badge
              variant={autosaveState === "saved" ? "success" : autosaveState === "saving" ? "info" : autosaveState === "error" ? "danger" : "default"}
            >
              {autosaveLabel}
            </Badge>
          </div>
        </div>

        {/* Title + subtitle display */}
        <div className="px-6 py-6">
          <h1 className="font-headline text-3xl font-extrabold leading-tight text-foreground md:text-4xl">
            {title || <span className="text-muted/50">Nouvel article…</span>}
          </h1>
          {subtitle && (
            <p className="mt-2 font-body text-lg text-muted">{subtitle}</p>
          )}
          {excerpt && (
            <p className="mt-3 max-w-3xl border-l-2 border-border-strong pl-4 font-body text-sm text-muted italic">
              {excerpt}
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div className="relative border-t border-border-subtle">
          <div
            className="h-0.5 bg-primary transition-all duration-500"
            style={{ width: `${completionScore}%` }}
          />
        </div>

        {/* Quick navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex flex-wrap gap-1">
            {[
              ["content", "Contenu", <AlignLeft key="c" className="h-3 w-3" />],
              ["media", "Image", <ImageIcon key="m" className="h-3 w-3" />],
              ["preview", "Aperçu", <Monitor key="p" className="h-3 w-3" />],
              ["workflow", "Workflow", <Clock key="w" className="h-3 w-3" />],
              ["metadata", "Métadonnées", <Tag key="mt" className="h-3 w-3" />],
              ["seo", "SEO", <SearchCode key="s" className="h-3 w-3" />],
              ["quality", "Qualité", <ShieldCheck key="q" className="h-3 w-3" />],
            ].map(([id, label, icon]) => (
              <button
                key={id as string}
                type="button"
                onClick={() => scrollToSection(id as string)}
                className="flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 font-label text-[11px] font-bold uppercase tracking-wide text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-label text-[11px] text-muted">
              {completionScore}% complété
              {missingChecks.length > 0 && (
                <span className="ml-1 text-accent-amber">
                  · {missingChecks.length} manquant{missingChecks.length > 1 ? "s" : ""}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* ── Role banners ──────────────────────────────────────────────────── */}
      {autosaveState === "error" ? (
        <AlertBanner variant="danger" title="Autosave échoué">
          Réessayez ou enregistrez manuellement avant de quitter l&apos;éditeur.
        </AlertBanner>
      ) : null}
      {role === "editor" && (
        <AlertBanner variant="info" title="Mode révision éditoriale">
          Examinez le contenu, les métadonnées et les commentaires. Utilisez les contrôles qualité pour valider avant d&apos;approuver ou de demander des révisions.
        </AlertBanner>
      )}
      {role === "publisher" && (
        <AlertBanner variant="info" title="Mode publication">
          Vérifiez l&apos;état de préparation avant de publier ou de programmer. Activez les signaux de diffusion si nécessaire.
        </AlertBanner>
      )}

      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">

        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div className="space-y-8">

          {/* Content section */}
          <section id="content" className="scroll-mt-20 space-y-0 border border-border-subtle bg-surface">
            <div className="flex items-center gap-2 border-b border-border-subtle px-5 py-3.5">
              <Newspaper className="h-3.5 w-3.5 text-muted" />
              <h2 className="font-label text-sm font-extrabold uppercase tracking-widest text-foreground">Contenu</h2>
              <span className="ml-auto font-label text-xs text-muted">
                {language === "fr" ? "🇫🇷 Français" : "🇺🇸 English"}
              </span>
            </div>

            <div className="space-y-0 divide-y divide-border-subtle">
              {/* Title — editorial-style large input */}
              <div className="px-5 py-4">
                <label htmlFor="title" className="mb-2 block font-label text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted">
                  Titre <span className="text-accent-coral">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={language === "fr" ? "Donnez un titre fort à votre article…" : "Give your article a strong title…"}
                  className="w-full bg-transparent font-headline text-2xl font-extrabold text-foreground placeholder:text-muted/40 focus:outline-none md:text-3xl"
                />
              </div>

              {/* Subtitle */}
              <div className="px-5 py-4">
                <label htmlFor="subtitle" className="mb-2 block font-label text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted">
                  Sous-titre
                </label>
                <input
                  id="subtitle"
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Sous-titre optionnel…"
                  className="w-full bg-transparent font-body text-lg text-foreground placeholder:text-muted/40 focus:outline-none"
                />
              </div>

              {/* Excerpt / Chapô */}
              <div className="px-5 py-4">
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="excerpt" className="font-label text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted">
                    Chapô <span className="text-accent-coral">*</span>
                  </label>
                  <span className="font-label text-[11px] text-muted">{excerpt.length} car.</span>
                </div>
                <p className="mb-3 font-body text-xs text-muted">Accroche affichée en page d&apos;accueil et dans les résultats de recherche.</p>
                <textarea
                  id="excerpt"
                  rows={3}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder={language === "fr" ? "Rédigez une accroche percutante (2–3 phrases)…" : "Write a compelling hook (2–3 sentences)…"}
                  className="w-full resize-none bg-transparent font-body text-sm text-foreground placeholder:text-muted/40 focus:outline-none"
                />
              </div>

              {/* Body */}
              <div className="px-5 py-4">
                <label className="mb-3 block font-label text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted">
                  Corps de l&apos;article <span className="text-accent-coral">*</span>
                </label>
                <NovelEditor
                  value={body}
                  onChange={setBody}
                  locale={language as "fr" | "en"}
                  placeholder={language === "fr" ? "Écrivez le contenu de votre article…" : "Write your article content…"}
                />
              </div>
            </div>
          </section>

          {/* Cover image */}
          <section id="media" className="scroll-mt-20 border border-border-subtle bg-surface">
            <div className="flex items-center gap-2 border-b border-border-subtle px-5 py-3.5">
              <ImageIcon className="h-3.5 w-3.5 text-muted" />
              <h2 className="font-label text-sm font-extrabold uppercase tracking-widest text-foreground">Image principale</h2>
            </div>
            <div className="space-y-4 px-5 py-5">
              <MediaUploader onUpload={uploadFile} value={coverImage} onChange={setCoverImage} />
              <Input
                label="Crédit photo"
                id="coverImageCaption"
                placeholder="Photo : AFP / Le Relief Haïti"
                value={coverImageCaption}
                onChange={(e) => setCoverImageCaption(e.target.value)}
              />
            </div>
          </section>

          {/* Preview */}
          <section id="preview" className="scroll-mt-20 border border-border-subtle bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Monitor className="h-3.5 w-3.5 text-muted" />
                <h2 className="font-label text-sm font-extrabold uppercase tracking-widest text-foreground">Aperçu</h2>
              </div>
              <div className="flex items-center overflow-hidden border border-border-subtle">
                {(["desktop", "mobile", "social"] as const).map((mode) => {
                  const icons = {
                    desktop: <Monitor className="h-3.5 w-3.5" />,
                    mobile: <Smartphone className="h-3.5 w-3.5" />,
                    social: <Share2 className="h-3.5 w-3.5" />,
                  };
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPreviewMode(mode)}
                      title={mode}
                      className={`flex items-center gap-1.5 px-3 py-1.5 font-label text-[11px] font-bold uppercase transition-colors ${
                        previewMode === mode
                          ? "bg-foreground text-background"
                          : "text-muted hover:bg-surface-elevated hover:text-foreground"
                      }`}
                    >
                      {icons[mode]}
                      <span className="hidden sm:inline">{mode}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-5">
              {previewMode === "desktop" && (
                <article className="border border-border-subtle bg-surface-elevated p-6">
                  <p className="page-kicker mb-3">Bureau — aperçu éditorial</p>
                  <h2 className="font-headline text-3xl font-extrabold leading-tight text-foreground">
                    {title || <span className="text-muted/50">Titre de prévisualisation</span>}
                  </h2>
                  {subtitle ? <p className="mt-2 font-body text-base text-muted">{subtitle}</p> : null}
                  {coverImage ? (
                    <div className="my-4 aspect-video w-full overflow-hidden bg-surface">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={coverImage} alt={coverImageCaption || title} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="my-4 flex aspect-video w-full items-center justify-center bg-surface text-muted">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                  {excerpt ? <p className="font-body text-base leading-relaxed text-foreground">{excerpt}</p> : null}
                </article>
              )}
              {previewMode === "mobile" && (
                <div className="mx-auto max-w-[390px]">
                  <article className="border border-border-subtle bg-surface-elevated p-4">
                    <p className="page-kicker mb-2">Mobile — aperçu</p>
                    <h2 className="font-headline text-xl font-extrabold leading-snug text-foreground">
                      {title || <span className="text-muted/50">Titre mobile</span>}
                    </h2>
                    {coverImage ? (
                      <div className="my-3 aspect-video w-full overflow-hidden bg-surface">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={coverImage} alt={coverImageCaption || title} className="h-full w-full object-cover" />
                      </div>
                    ) : null}
                    {excerpt ? <p className="mt-2 font-body text-sm leading-relaxed text-muted">{excerpt}</p> : null}
                  </article>
                </div>
              )}
              {previewMode === "social" && (
                <div className="mx-auto max-w-[500px]">
                  <article className="overflow-hidden border border-border-subtle bg-surface-elevated">
                    {coverImage ? (
                      <div className="aspect-[1.91/1] w-full overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={coverImage} alt={title} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex aspect-[1.91/1] w-full items-center justify-center bg-surface text-muted">
                        <ImageIcon className="h-10 w-10" />
                      </div>
                    )}
                    <div className="p-4">
                      <p className="font-label text-[10px] uppercase tracking-widest text-muted">le-relief.com · {slug || "votre-slug"}</p>
                      <h2 className="mt-1 font-headline text-lg font-extrabold leading-snug text-foreground">
                        {seoTitle || title || <span className="text-muted/50">SEO title</span>}
                      </h2>
                      <p className="mt-1 font-body text-sm text-muted">
                        {metaDescription || excerpt || <span className="italic">Meta description manquante</span>}
                      </p>
                    </div>
                  </article>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <aside className="space-y-6 xl:sticky xl:top-20 xl:max-h-[calc(100vh-5rem)] xl:overflow-y-auto">

          {/* Action panel */}
          <div className="space-y-4">
            <section className="border border-border-subtle bg-surface">
              <div className="border-b border-border-subtle px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <p className="font-label text-sm font-extrabold uppercase tracking-wide text-foreground">Publication</p>
                  <Badge
                    variant={autosaveState === "saved" ? "success" : autosaveState === "saving" ? "info" : autosaveState === "error" ? "danger" : "default"}
                  >
                    {autosaveLabel}
                  </Badge>
                </div>
              </div>

              {/* Status + completion summary */}
              <div className="grid grid-cols-2 divide-x divide-border-subtle border-b border-border-subtle">
                <div className="px-4 py-3">
                  <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted">Statut</p>
                  <div className="mt-2">
                    <StatusChip status={normalizedStatus} />
                  </div>
                </div>
                <div className="px-4 py-3">
                  <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted">Complétude</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-elevated">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          completionScore >= 90 ? "bg-accent-teal" : completionScore >= 70 ? "bg-accent-blue" : "bg-accent-amber"
                        }`}
                        style={{ width: `${completionScore}%` }}
                      />
                    </div>
                    <span className="font-label text-xs font-bold text-foreground">{completionScore}%</span>
                  </div>
                  {missingChecks.length > 0 && (
                    <p className="mt-1 font-label text-[11px] text-muted">
                      {missingChecks.map((c) => c.label).join(", ")}
                    </p>
                  )}
                </div>
              </div>

              {/* CTA buttons */}
              <div className="space-y-2 p-4">
                {submitError && (
                  <div className="mb-2 rounded border border-accent-coral/40 bg-accent-coral/10 px-3 py-2 font-label text-xs text-accent-coral">
                    {submitError}
                  </div>
                )}
                {/* Primary action — always full width, prominent */}
                <Button
                  onClick={() => handleSubmit(status)}
                  disabled={saving || !title || !body}
                  className="w-full justify-center"
                  size="lg"
                >
                  {saving ? "Enregistrement…" : submitLabel}
                </Button>

                {/* Secondary workflow actions */}
                <div className="flex flex-col gap-1.5 pt-1">
                  {canSaveDraft ? (
                    <button
                      type="button"
                      onClick={() => handleSubmit("draft")}
                      disabled={saving || !title}
                      className="flex w-full items-center justify-between px-3 py-2 font-label text-xs font-bold uppercase tracking-wide text-foreground transition-colors hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span>Enregistrer brouillon</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
                    </button>
                  ) : null}
                  {canRequestReview ? (
                    <button
                      type="button"
                      onClick={() => handleSubmit("in_review")}
                      disabled={saving || !title || !body}
                      className="flex w-full items-center justify-between px-3 py-2 font-label text-xs font-bold uppercase tracking-wide text-foreground transition-colors hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span>Soumettre en revue</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
                    </button>
                  ) : null}
                  {canApprove && role !== "writer" ? (
                    <button
                      type="button"
                      onClick={() => handleSubmit("approved")}
                      disabled={saving || !title || !body}
                      className="flex w-full items-center justify-between px-3 py-2 font-label text-xs font-bold uppercase tracking-wide text-accent-teal transition-colors hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span>Approuver</span>
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                  {scheduledAt && role !== "writer" ? (
                    <button
                      type="button"
                      onClick={() => handleSubmit("scheduled")}
                      disabled={saving || !title || !body}
                      className="flex w-full items-center justify-between px-3 py-2 font-label text-xs font-bold uppercase tracking-wide text-accent-amber transition-colors hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span>Programmer</span>
                      <Clock className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                  {canPublish && role !== "writer" ? (
                    <button
                      type="button"
                      onClick={() => handleSubmit("published")}
                      disabled={saving || !title || !body}
                      className="flex w-full items-center justify-between border-t border-border-subtle px-3 py-2 font-label text-xs font-bold uppercase tracking-wide text-primary transition-colors hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span>Publier maintenant</span>
                      <Zap className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>
            </section>
          </div>

          {/* Workflow section */}
          <EditorSection
            id="workflow"
            title="Workflow & publication"
            open={openSections.workflow}
            onToggle={() => toggleSection("workflow")}
          >
            <div>
              <label className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">
                Statut éditorial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-border-subtle bg-surface px-4 py-3 font-label text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {statusOptions.map((option) => {
                  const allowed = canTransitionStatus({
                    role,
                    fromStatus: status,
                    toStatus: option.value,
                    isOwner,
                  }).allowed;
                  return (
                    <option key={option.value} value={option.value} disabled={!allowed && option.value !== status}>
                      {option.label}
                    </option>
                  );
                })}
              </select>
              <p className="mt-2 font-body text-xs text-muted">
                Les statuts disponibles dépendent de votre rôle et de l&apos;état actuel de l&apos;article.
              </p>
            </div>

            {role !== "writer" && (
              <div className="grid gap-4 border-t border-border-subtle pt-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">
                    Publication programmée
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full border border-border-subtle bg-surface px-4 py-3 font-label text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <Input
                  label="Niveau de priorité"
                  id="priorityLevel"
                  placeholder="normal, urgent, majeur"
                  value={priorityLevel}
                  onChange={(e) => setPriorityLevel(e.target.value)}
                />

                <div className="space-y-3 border border-border-subtle p-3">
                  <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted">
                    Signaux de diffusion
                  </p>
                  <label className="flex cursor-pointer items-center gap-2.5 font-label text-sm font-bold text-foreground">
                    <input
                      type="checkbox"
                      checked={isBreaking}
                      onChange={(e) => setIsBreaking(e.target.checked)}
                      className="h-4 w-4 accent-primary"
                    />
                    Breaking news
                  </label>
                  <label className="flex cursor-pointer items-center gap-2.5 font-label text-sm font-bold text-foreground">
                    <input
                      type="checkbox"
                      checked={isHomepagePinned}
                      onChange={(e) => setIsHomepagePinned(e.target.checked)}
                      className="h-4 w-4 accent-primary"
                    />
                    Épingler en Une
                  </label>
                </div>
              </div>
            )}

            {(role === "editor" || role === "publisher" || role === "admin") && (
              <div className="space-y-4 border-t border-border-subtle pt-4">
                <div>
                  <label htmlFor="assignedTo" className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">
                    Assigner à
                  </label>
                  <select
                    id="assignedTo"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full border border-border-subtle bg-surface px-4 py-3 font-label text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="">— Non assigné —</option>
                    {staffUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {String(u.name || u.id)}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 font-body text-xs text-muted">Journaliste ou rédacteur en charge de cet article.</p>
                </div>

                <div>
                  <label htmlFor="coAuthors" className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">
                    Co-auteurs
                  </label>
                  <input
                    id="coAuthors"
                    type="text"
                    placeholder="Jean Dupont, Marie Toto"
                    value={coAuthorsInput}
                    onChange={(e) => setCoAuthorsInput(e.target.value)}
                    className="w-full border border-border-subtle bg-surface px-4 py-3 font-label text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                  <p className="mt-1.5 font-body text-xs text-muted">Noms séparés par des virgules — apparaîtront dans la signature de l&apos;article.</p>
                </div>
              </div>
            )}
          </EditorSection>

          {/* Metadata */}
          <EditorSection
            id="metadata"
            title="Métadonnées"
            open={openSections.metadata}
            onToggle={() => toggleSection("metadata")}
          >
            <div>
              <label className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">Catégorie</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border border-border-subtle bg-surface px-4 py-3 font-label text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">Type de contenu</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full border border-border-subtle bg-surface px-4 py-3 font-label text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="actualite">Actualité</option>
                <option value="analyse">Analyse</option>
                <option value="opinion">Opinion</option>
                <option value="editorial">Éditorial</option>
                <option value="tribune">Tribune</option>
                <option value="dossier">Dossier</option>
                <option value="fact_check">Fact-checking</option>
                <option value="emission_speciale">Émission spéciale</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">Langue</label>
              <select
                value={language}
                onChange={(e) => {
                  const nextLanguage = e.target.value;
                  setLanguage(nextLanguage);
                  setSubmitError("");
                  setSourceError("");
                  if (nextLanguage === "fr") {
                    setSourceArticleId("");
                    setSourceArticlePreview(null);
                    setTranslationStatus("not_applicable");
                  } else if (translationStatus === "not_applicable") {
                    setTranslationStatus("not_started");
                  }
                }}
                className="w-full border border-border-subtle bg-surface px-4 py-3 font-label text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="fr">🇫🇷 Français</option>
                <option value="en">🇺🇸 English</option>
              </select>
            </div>

            <div>
              <label htmlFor="tags" className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">
                Tags
              </label>
              <input
                id="tags"
                type="text"
                placeholder="politique, économie, société"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full border border-border-subtle bg-surface px-4 py-3 font-label text-sm text-foreground focus:border-primary focus:outline-none"
              />
              <p className="mt-1.5 font-body text-xs text-muted">Séparez les tags par des virgules.</p>
            </div>
          </EditorSection>

          {/* SEO */}
          <EditorSection
            id="seo"
            title="SEO"
            open={openSections.seo}
            onToggle={() => toggleSection("seo")}
          >
            <Input
              label="Slug"
              id="slug"
              placeholder="titre-article-en-minuscules"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />

            <div>
              <Input
                label="SEO title"
                id="seoTitle"
                placeholder="Titre optimisé pour Google (60 car. max)"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
              />
              <div className="mt-1.5 flex items-center justify-between">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-elevated mr-3">
                  <div
                    className={`h-1 rounded-full transition-all ${seoTitle.length > 60 ? "bg-accent-coral" : seoTitle.length > 50 ? "bg-accent-amber" : "bg-accent-teal"}`}
                    style={{ width: `${Math.min((seoTitle.length / 60) * 100, 100)}%` }}
                  />
                </div>
                <span className={`shrink-0 font-label text-[11px] ${seoTitle.length > 60 ? "text-accent-coral" : "text-muted"}`}>
                  {seoTitle.length}/60
                </span>
              </div>
            </div>

            <div>
              <Input
                label="Meta description"
                id="metaDescription"
                placeholder="Résumé pour Google (155 car. max)"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
              />
              <div className="mt-1.5 flex items-center justify-between">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-elevated mr-3">
                  <div
                    className={`h-1 rounded-full transition-all ${metaDescription.length > 155 ? "bg-accent-coral" : metaDescription.length > 130 ? "bg-accent-amber" : "bg-accent-teal"}`}
                    style={{ width: `${Math.min((metaDescription.length / 155) * 100, 100)}%` }}
                  />
                </div>
                <span className={`shrink-0 font-label text-[11px] ${metaDescription.length > 155 ? "text-accent-coral" : "text-muted"}`}>
                  {metaDescription.length}/155
                </span>
              </div>
            </div>
          </EditorSection>

          {/* Translation */}
          <EditorSection
            id="translation"
            title="Traduction"
            open={openSections.translation}
            onToggle={() => toggleSection("translation")}
          >
            <div>
              <label className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">Statut de traduction</label>
              <select
                value={translationStatus}
                onChange={(e) => setTranslationStatus(e.target.value)}
                className="w-full border border-border-subtle bg-surface px-4 py-3 font-label text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {language === "fr" && <option value="not_applicable">Non concerné</option>}
                {language === "en" && <option value="not_started">Non lancée</option>}
                {language === "en" && <option value="generated_draft">Brouillon IA</option>}
                {language === "en" && <option value="in_review">En revue</option>}
                {language === "en" && <option value="approved">Approuvée</option>}
                {language === "en" && <option value="published">Publiée</option>}
                {language === "en" && <option value="rejected">Rejetée</option>}
              </select>
            </div>

            <Input
              label="Slug langue liée"
              id="alternateLanguageSlug"
              placeholder="slug-de-la-version-liee"
              value={alternateLanguageSlug}
              onChange={(e) => setAlternateLanguageSlug(e.target.value)}
            />

            {language === "fr" ? (
              <div className="space-y-3 border border-border-subtle p-3">
                <label className="flex cursor-pointer items-center gap-3 font-label text-sm font-bold text-foreground">
                  <input
                    type="checkbox"
                    checked={allowTranslation}
                    onChange={(e) => setAllowTranslation(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  Éligible traduction EN
                </label>
                <Input
                  label="Priorité de traduction"
                  id="translationPriority"
                  placeholder="élevée, moyenne, basse"
                  value={translationPriority}
                  onChange={(e) => setTranslationPriority(e.target.value)}
                />
              </div>
            ) : (
              <SourceArticlePicker
                value={sourceArticleId}
                currentArticleId={initial?.id}
                error={sourceError}
                onChange={(articleId) => {
                  setSourceArticleId(articleId);
                  if (sourceError) setSourceError("");
                }}
                onArticleSelected={(source) => {
                  setSourceArticlePreview(source);
                  if (source?.slug) setAlternateLanguageSlug(source.slug);
                }}
              />
            )}

            {/* Translation links */}
            {language === "fr" && translations.length > 0 && (
              <div className="border-t border-border-subtle pt-3">
                <p className="mb-2 font-label text-xs font-extrabold uppercase text-foreground">Versions EN existantes</p>
                <ul className="space-y-1">
                  {translations.map((translation) => (
                    <li key={translation.id}>
                      <Link
                        href={`/admin/articles/${translation.id}/edit`}
                        className="flex items-center gap-1.5 font-label text-xs text-accent-blue hover:underline"
                      >
                        <GitBranch className="h-3 w-3" />
                        {translation.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {language === "en" && sourceArticlePreview?.id && (
              <div className="border-t border-border-subtle pt-3">
                <p className="mb-2 font-label text-xs font-extrabold uppercase text-foreground">Article source FR</p>
                <Link
                  href={`/admin/articles/${sourceArticlePreview.id}/edit`}
                  className="flex items-center gap-1.5 font-label text-xs text-accent-blue hover:underline"
                >
                  <GitBranch className="h-3 w-3" />
                  {sourceArticlePreview.title}
                </Link>
              </div>
            )}
          </EditorSection>

          {/* Quality checks */}
          <EditorSection
            id="quality"
            title="Contrôle qualité"
            open={openSections.quality}
            onToggle={() => toggleSection("quality")}
          >
            <ul className="space-y-0 divide-y divide-border-subtle">
              {qualityChecks.map((check) => (
                <li key={check.label} className="flex items-center justify-between py-2.5">
                  <span className="font-label text-sm text-foreground">{check.label}</span>
                  {check.ok ? (
                    <span className="flex items-center gap-1 font-label text-[11px] font-bold text-accent-teal">
                      <Check className="h-3.5 w-3.5" />
                      OK
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-label text-[11px] font-bold text-accent-amber">
                      <CircleDot className="h-3.5 w-3.5" />
                      À compléter
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <div className="pt-1">
              <div className="flex items-center justify-between">
                <span className="font-label text-xs text-muted">Progression globale</span>
                <span className={`font-label text-xs font-bold ${completionScore >= 90 ? "text-accent-teal" : completionScore >= 70 ? "text-accent-blue" : "text-accent-amber"}`}>
                  {completionScore}%
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                <div
                  className={`h-1.5 rounded-full transition-all duration-700 ${completionScore >= 90 ? "bg-accent-teal" : completionScore >= 70 ? "bg-accent-blue" : "bg-accent-amber"}`}
                  style={{ width: `${completionScore}%` }}
                />
              </div>
            </div>
          </EditorSection>

          {/* Correction */}
          <EditorSection id="correction" title="Correction" open={openSections.correction} onToggle={() => toggleSection("correction")}>
            <div className="space-y-4">
              <div>
                <label htmlFor="correctionDate" className="mb-1 block font-label text-xs font-extrabold uppercase text-foreground">
                  Date de correction
                </label>
                <input
                  id="correctionDate"
                  type="date"
                  value={correctionDate}
                  onChange={(e) => setCorrectionDate(e.target.value)}
                  className="w-full border border-border-subtle bg-surface px-4 py-3 font-body text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="correction" className="mb-1 block font-label text-xs font-extrabold uppercase text-foreground">
                  Texte de correction
                </label>
                <textarea
                  id="correction"
                  rows={3}
                  value={correction}
                  onChange={(e) => setCorrection(e.target.value)}
                  placeholder="Décrire la correction apportée à cet article…"
                  className="w-full resize-none border border-border-subtle bg-surface px-4 py-3 font-body text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </EditorSection>
        </aside>
      </div>

      {submitError ? <AlertBanner variant="danger" title="Enregistrement impossible">{submitError}</AlertBanner> : null}

      {/* ── Social & collaboration ─────────────────────────────────────────── */}
      {isExistingArticle && initial?.id ? (
        <>
          <div className="flex flex-wrap items-center gap-4 border border-primary/30 bg-primary/[0.03] px-5 py-4">
            <div className="flex-1">
              <p className="font-label text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
                Réseaux sociaux
              </p>
              <p className="mt-1 font-body text-sm text-foreground">
                Générez les visuels Instagram, Facebook, X et WhatsApp pour cet article.
              </p>
            </div>
            <Link
              href={`/admin/social/${initial.id}`}
              className="inline-flex items-center gap-2 border border-primary bg-primary px-4 py-2.5 font-label text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-primary/90"
            >
              <Share2 className="h-3.5 w-3.5" />
              Générer les visuels sociaux
            </Link>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <CommentsPanel articleId={initial.id} />
            <HistoryPanel articleId={initial.id} />
          </div>
        </>
      ) : null}
    </div>
  );
}
