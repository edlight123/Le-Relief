"use client";

import Link from "next/link";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
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
  }) => Promise<void>;
  submitLabel?: string;
}

function EditorSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-border-subtle bg-surface">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-surface-elevated"
      >
        <p className="font-label text-sm font-extrabold uppercase tracking-wide text-foreground">{title}</p>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted" />
        )}
      </button>
      {open ? <div className="space-y-4 border-t border-border-subtle p-4">{children}</div> : null}
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

  function toggleSection(section: keyof typeof openSections) {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  }

  async function uploadFile(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    return data.url;
  }

  return (
    <div className="space-y-6 border-t-2 border-border-strong pt-5">
      <div className="sticky top-0 z-20 border border-border-subtle bg-surface shadow-sm backdrop-blur supports-[backdrop-filter]:bg-surface/95">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          {/* Left: title + status */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip status={normalizedStatus} />
                {isBreaking ? <PriorityFlag kind="breaking" /> : null}
                {isHomepagePinned ? <PriorityFlag kind="homepage" /> : null}
                <Badge
                  variant={autosaveState === "saved" ? "success" : autosaveState === "saving" ? "info" : autosaveState === "error" ? "danger" : "default"}
                >
                  {autosaveState === "saved"
                    ? "Sauvegardé"
                    : autosaveState === "saving"
                    ? "Enregistrement…"
                    : autosaveState === "error"
                    ? "Erreur autosave"
                    : "Prêt"}
                </Badge>
                <Badge variant={completionVariant}>{completionScore}% complété</Badge>
              </div>
              <h1 className="mt-0.5 truncate font-headline text-lg font-extrabold text-foreground">
                {title || "Nouvel article"}
              </h1>
            </div>
          </div>

          {/* Right: preview mode + actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Preview mode toggles */}
            <div className="flex items-center gap-1 border border-border-subtle p-0.5">
              {(["desktop", "mobile", "social"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPreviewMode(mode)}
                  className={`px-2.5 py-1 font-label text-[11px] font-bold uppercase ${
                    previewMode === mode
                      ? "bg-foreground text-background"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Workflow action buttons */}
            {canSaveDraft ? (
              <Button
                variant="outline"
                onClick={() => handleSubmit("draft")}
                disabled={saving || !title}
              >
                Brouillon
              </Button>
            ) : null}
            {scheduledAt && role !== "writer" ? (
              <Button
                variant="outline"
                onClick={() => handleSubmit("scheduled")}
                disabled={saving || !title || !body}
              >
                Programmer
              </Button>
            ) : null}
            {canRequestReview ? (
              <Button
                variant="outline"
                onClick={() => handleSubmit("in_review")}
                disabled={saving || !title || !body}
              >
                Soumettre en revue
              </Button>
            ) : null}
            {canApprove && role !== "writer" ? (
              <Button
                variant="outline"
                onClick={() => handleSubmit("approved")}
                disabled={saving || !title || !body}
              >
                Approuver
              </Button>
            ) : null}
            {canPublish && role !== "writer" ? (
              <Button
                variant="outline"
                onClick={() => handleSubmit("published")}
                disabled={saving || !title || !body}
              >
                Publier
              </Button>
            ) : null}
            <Button onClick={() => handleSubmit(status)} disabled={saving || !title || !body}>
              {saving ? "Enregistrement..." : submitLabel}
            </Button>
          </div>
        </div>
      </div>

      {/* Role context bar */}
      <div className="flex flex-wrap items-center gap-2 border border-border-subtle bg-surface-elevated px-4 py-2">
        <span className="font-label text-xs text-muted">Mode :</span>
        {role === "writer" && <Badge variant="default">Rédaction</Badge>}
        {role === "editor" && <Badge variant="info">Révision éditoriale</Badge>}
        {role === "publisher" && <Badge variant="warning">Publication</Badge>}
        {role === "admin" && <Badge variant="danger">Admin</Badge>}
        <span className="mx-1 text-border-subtle">·</span>
        <Badge variant="default">{language === "fr" ? "Français" : "English"}</Badge>
        <Badge variant="default">{contentType || "Type non défini"}</Badge>
        {translationStatus && translationStatus !== "not_applicable" && (
          <Badge variant={statusVariant}>Traduction : {translationStatus}</Badge>
        )}
      </div>

      {missingChecks.length > 0 ? (
        <AlertBanner variant="warning" title="Points à compléter avant publication">
          <p>
            Champs manquants : {missingChecks.map((check) => check.label).join(", ")}.
          </p>
        </AlertBanner>
      ) : null}

      {autosaveState === "error" ? (
        <AlertBanner variant="danger" title="Autosave échoué">
          Réessayez ou enregistrez manuellement avant de quitter l’éditeur.
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
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="space-y-5 border border-border-subtle p-5">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h2 className="font-label text-sm font-extrabold uppercase tracking-widest text-foreground">Contenu</h2>
              <span className="font-label text-xs text-muted">Langue : <span className="font-bold text-foreground">{language === "fr" ? "Français" : "English"}</span></span>
            </div>

            <Input
              label="Titre *"
              id="title"
              placeholder="Titre de l'article"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <Input
              label="Sous-titre"
              id="subtitle"
              placeholder="Sous-titre optionnel"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />

            <div>
              <label htmlFor="excerpt" className="mb-1 block font-label text-xs font-extrabold uppercase text-foreground">
                Chapô / Résumé *
              </label>
              <p className="mb-2 font-body text-xs text-muted">Accroche courte affichée en page d&apos;accueil et dans les résultats de recherche.</p>
              <textarea
                id="excerpt"
                rows={3}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder={language === "fr" ? "Rédigez un résumé accrocheur (2–3 phrases)…" : "Write a short compelling summary (2–3 sentences)…"}
                className="w-full resize-none border border-border-subtle bg-surface px-4 py-3 font-body text-sm text-foreground focus:border-primary focus:outline-none"
              />
              <p className="mt-1 text-right font-label text-[11px] text-muted">{excerpt.length} car.</p>
            </div>

            <div>
              <label className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">
                Corps de l&apos;article *
              </label>
              <NovelEditor
                value={body}
                onChange={setBody}
                locale={language as "fr" | "en"}
                placeholder={language === "fr" ? "Écrivez le contenu de votre article..." : "Write your article content..."}
              />
            </div>

          </section>

          <section className="space-y-4 border border-border-subtle p-5">
            <h2 className="border-b border-border-subtle pb-3 font-label text-sm font-extrabold uppercase tracking-widest text-foreground">Image principale</h2>
            <MediaUploader onUpload={uploadFile} value={coverImage} onChange={setCoverImage} />
            <Input
              label="Crédit photo"
              id="coverImageCaption"
              placeholder="Photo : AFP / Le Relief Haïti"
              value={coverImageCaption}
              onChange={(e) => setCoverImageCaption(e.target.value)}
            />
          </section>

          <section className="space-y-4 border border-border-subtle p-4">
            <p className="font-label text-xs font-extrabold uppercase text-muted">Prévisualisation</p>
            {previewMode === "desktop" && (
              <article className="border border-border-subtle bg-surface p-5">
                <p className="page-kicker">Desktop</p>
                <h2 className="mt-2 font-headline text-3xl font-extrabold leading-tight text-foreground">
                  {title || "Titre de prévisualisation"}
                </h2>
                {subtitle ? <p className="mt-2 font-body text-muted">{subtitle}</p> : null}
                {excerpt ? <p className="mt-4 font-body text-base text-foreground">{excerpt}</p> : null}
              </article>
            )}
            {previewMode === "mobile" && (
              <article className="mx-auto max-w-[360px] border border-border-subtle bg-surface p-4">
                <p className="page-kicker">Mobile</p>
                <h2 className="mt-2 font-headline text-xl font-extrabold leading-snug text-foreground">
                  {title || "Titre mobile"}
                </h2>
                {excerpt ? <p className="mt-3 font-body text-sm text-muted">{excerpt}</p> : null}
              </article>
            )}
            {previewMode === "social" && (
              <article className="max-w-xl border border-border-subtle bg-surface p-4">
                <p className="page-kicker">Social card</p>
                <p className="mt-2 font-label text-xs uppercase text-muted">{slug || "votre-slug"}</p>
                <h2 className="mt-1 font-headline text-lg font-extrabold text-foreground">
                  {seoTitle || title || "SEO title"}
                </h2>
                <p className="mt-2 font-body text-sm text-muted">
                  {metaDescription || excerpt || "Meta description"}
                </p>
              </article>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <EditorSection
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
            </div>

            {role !== "writer" && (
              <div className="grid gap-3 border-t border-border-subtle pt-4 md:grid-cols-2">
                <div className="space-y-3 md:col-span-2">
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

                <div className="space-y-2 border border-border-subtle p-3">
                  <p className="font-label text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted">
                    Signaux de diffusion
                  </p>
                  <label className="flex items-center gap-2 font-label text-xs font-extrabold uppercase text-foreground">
                    <input
                      type="checkbox"
                      checked={isBreaking}
                      onChange={(e) => setIsBreaking(e.target.checked)}
                      className="h-4 w-4 accent-primary"
                    />
                    Marquer Breaking
                  </label>

                  <label className="flex items-center gap-2 font-label text-xs font-extrabold uppercase text-foreground">
                    <input
                      type="checkbox"
                      checked={isHomepagePinned}
                      onChange={(e) => setIsHomepagePinned(e.target.checked)}
                      className="h-4 w-4 accent-primary"
                    />
                    Épingler homepage
                  </label>
                </div>
              </div>
            )}
          </EditorSection>

          <EditorSection
            title="Métadonnées"
            open={openSections.metadata}
            onToggle={() => toggleSection("metadata")}
          >
            <div>
              <label className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">
                Catégorie
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border border-border-subtle bg-surface px-4 py-3 font-label text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">
                Type de contenu
              </label>
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
              <label className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">
                Langue
              </label>
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
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="tags"
                className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground"
              >
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
            </div>
          </EditorSection>

          <EditorSection
            title="SEO"
            open={openSections.seo}
            onToggle={() => toggleSection("seo")}
          >
            <Input
              label="Slug"
              id="slug"
              placeholder="titre-article"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />

            <div>
              <Input
                label="SEO title"
                id="seoTitle"
                placeholder="Titre optimisé SEO"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
              />
              <p className={`mt-1 text-right font-label text-[11px] ${seoTitle.length > 60 ? "text-danger" : "text-muted"}`}>
                {seoTitle.length}/60
              </p>
            </div>

            <div>
              <Input
                label="Meta description"
                id="metaDescription"
                placeholder="Résumé SEO (155 caractères max)"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
              />
              <p className={`mt-1 text-right font-label text-[11px] ${metaDescription.length > 155 ? "text-danger" : "text-muted"}`}>
                {metaDescription.length}/155
              </p>
            </div>
          </EditorSection>

          <EditorSection
            title="Traduction"
            open={openSections.translation}
            onToggle={() => toggleSection("translation")}
          >
            <div>
              <label className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">
                Statut de traduction
              </label>
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
                <label className="flex items-center gap-3 font-label text-xs font-extrabold uppercase text-foreground">
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
                  if (source?.slug) {
                    setAlternateLanguageSlug(source.slug);
                  }
                }}
              />
            )}
          </EditorSection>

          <EditorSection
            title="Contrôle qualité"
            open={openSections.quality}
            onToggle={() => toggleSection("quality")}
          >
            <ul className="space-y-1">
              {qualityChecks.map((check) => (
                <li key={check.label} className="flex items-center justify-between text-xs">
                  <span className="font-label text-muted">{check.label}</span>
                  <Badge variant={check.ok ? "success" : "warning"}>{check.ok ? "OK" : "Manquant"}</Badge>
                </li>
              ))}
            </ul>
            <div className="h-2 w-full rounded-full bg-surface-elevated">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${completionScore}%` }} />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-label text-xs font-extrabold uppercase text-foreground">Statut de traduction</span>
              <Badge variant={statusVariant}>{translationStatus}</Badge>
            </div>

            {language === "fr" ? (
              <div>
                <p className="mb-2 font-label text-xs font-extrabold uppercase text-foreground">Traductions EN existantes</p>
                {translations.length === 0 ? (
                  <p className="font-label text-xs text-muted">Aucune traduction EN liée.</p>
                ) : (
                  <ul className="space-y-1">
                    {translations.map((translation) => (
                      <li key={translation.id}>
                        <Link
                          href={`/dashboard/articles/${translation.id}/edit`}
                          className="font-label text-xs text-accent-blue underline"
                        >
                          {translation.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div>
                <p className="mb-2 font-label text-xs font-extrabold uppercase text-foreground">Article source FR</p>
                {sourceArticlePreview?.id ? (
                  <Link
                    href={`/dashboard/articles/${sourceArticlePreview.id}/edit`}
                    className="font-label text-xs text-accent-blue underline"
                  >
                    {sourceArticlePreview.title}
                  </Link>
                ) : (
                  <p className="font-label text-xs text-muted">Aucune source FR sélectionnée.</p>
                )}
              </div>
            )}
          </EditorSection>

          <EditorSection title="Correction" open={openSections.correction} onToggle={() => toggleSection("correction")}>
            <div className="space-y-3">
              <div>
                <label htmlFor="correctionDate" className="mb-1 block font-label text-xs font-extrabold uppercase text-foreground">
                  Date de correction
                </label>
                <input
                  id="correctionDate"
                  type="date"
                  value={correctionDate}
                  onChange={(e) => setCorrectionDate(e.target.value)}
                  className="w-full border border-border-subtle bg-background px-3 py-2 font-body text-sm"
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
                  className="w-full resize-none border border-border-subtle bg-background px-3 py-2 font-body text-sm"
                />
              </div>
            </div>
          </EditorSection>
        </aside>
      </div>

      {submitError ? <AlertBanner variant="danger" title="Enregistrement impossible">{submitError}</AlertBanner> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border border-border-subtle bg-surface p-4">
        <div>
          <p className="font-label text-xs font-extrabold uppercase tracking-[0.18em] text-muted">
            Résumé de validation
          </p>
          <p className="mt-1 font-body text-sm text-foreground">
            {missingChecks.length === 0
              ? "Tous les blocs requis sont complétés pour une mise en ligne sereine."
              : `Encore ${missingChecks.length} point${missingChecks.length > 1 ? "s" : ""} à compléter avant publication.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={normalizedStatus} />
          <Badge variant={completionVariant}>Complétude {completionScore}%</Badge>
          <Badge variant={statusVariant}>Traduction {translationStatus}</Badge>
        </div>
      </div>

      {isExistingArticle && initial?.id ? (
        <>
          <div className="flex flex-wrap items-center gap-3 border border-primary/40 bg-primary/5 p-4">
            <div className="flex-1">
              <p className="font-label text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
                Réseaux sociaux
              </p>
              <p className="mt-1 font-body text-sm text-foreground">
                Générez les visuels Instagram, Facebook, X, WhatsApp et autres plateformes pour cet article.
              </p>
            </div>
            <Link
              href={`/admin/social/${initial.id}`}
              className="inline-flex items-center gap-2 border border-primary bg-primary px-4 py-2 font-label text-xs uppercase tracking-wider text-on-primary hover:bg-primary/90"
            >
              Générer les visuels sociaux →
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
