"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

interface CommentItem {
  id: string;
  body: string;
  type: "comment" | "blocking" | "revision_note";
  createdAt?: string;
  resolvedAt?: string | null;
  author?: { name?: string | null } | null;
}

export default function CommentsPanel({ articleId }: { articleId: string }) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [body, setBody] = useState("");
  const [type, setType] = useState<CommentItem["type"]>("comment");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadComments() {
      const res = await fetch(`/api/articles/${articleId}/comments`);
      const data = await res.json();
      if (!active) return;
      setComments(data.comments || []);
      setLoading(false);
    }

    void loadComments();
    return () => {
      active = false;
    };
  }, [articleId]);

  async function addComment() {
    if (!body.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/articles/${articleId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.trim(), type }),
    });

    if (res.ok) {
      setBody("");
      setType("comment");
      const listRes = await fetch(`/api/articles/${articleId}/comments`);
      const listData = await listRes.json();
      setComments(listData.comments || []);
    }
    setSubmitting(false);
  }

  async function resolve(commentId: string) {
    const res = await fetch(`/api/articles/${articleId}/comments/${commentId}`, {
      method: "PATCH",
    });
    if (res.ok) {
      const listRes = await fetch(`/api/articles/${articleId}/comments`);
      const listData = await listRes.json();
      setComments(listData.comments || []);
    }
  }

  return (
    <section className="space-y-4 border border-border-subtle p-4">
      <h3 className="font-label text-xs font-extrabold uppercase text-foreground">Commentaires éditoriaux</h3>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Ajouter un commentaire interne..."
          className="w-full border border-border-subtle bg-surface px-3 py-2 font-label text-sm text-foreground focus:border-primary focus:outline-none"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as CommentItem["type"])}
          className="border border-border-subtle bg-surface px-3 py-2 font-label text-sm text-foreground"
        >
          <option value="comment">Commentaire</option>
          <option value="revision_note">Note de révision</option>
          <option value="blocking">Bloquant</option>
        </select>
        <Button onClick={addComment} disabled={submitting || !body.trim()}>
          Ajouter
        </Button>
      </div>

      {loading ? (
        <p className="font-label text-xs text-muted">Chargement...</p>
      ) : comments.length === 0 ? (
        <p className="font-label text-xs text-muted">Aucun commentaire.</p>
      ) : (
        <ul className="space-y-2">
          {comments.map((comment) => (
            <li key={comment.id} className="border border-border-subtle p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant={comment.type === "blocking" ? "danger" : comment.type === "revision_note" ? "warning" : "default"}>
                  {comment.type}
                </Badge>
                {comment.resolvedAt ? <Badge variant="success">Résolu</Badge> : null}
                <span className="font-label text-[11px] text-muted">
                  {comment.author?.name || "Rédaction"}
                </span>
              </div>
              <p className="font-body text-sm text-foreground">{comment.body}</p>
              {!comment.resolvedAt ? (
                <button
                  type="button"
                  onClick={() => resolve(comment.id)}
                  className="mt-2 font-label text-xs font-bold text-primary hover:underline"
                >
                  Marquer résolu
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
