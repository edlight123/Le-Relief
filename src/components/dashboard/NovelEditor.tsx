"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import CharacterCount from "@tiptap/extension-character-count";
import { createLowlight, all } from "lowlight";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Quote,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Link,
  Link2Off,
  Highlighter,
  Undo,
  Redo,
  Pilcrow,
  SeparatorHorizontal,
} from "lucide-react";

const lowlight = createLowlight(all);

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title?: string;
}

function ToolbarButton({ onClick, active, children, title }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-sm text-xs transition-colors ${
        active
          ? "bg-foreground text-background"
          : "text-muted hover:bg-surface-elevated hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-0.5 h-5 w-px bg-border-subtle" />;
}

interface NovelEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  locale?: "fr" | "en";
}

export default function NovelEditor({
  value,
  onChange,
  placeholder = "Écrivez votre article...",
  locale = "fr",
}: NovelEditorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    startTransition(() => setIsMounted(true));
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: false,
        blockquote: {
          HTMLAttributes: {
            class: "border-l-3 border-primary pl-4 italic font-headline",
          },
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2 hover:text-primary-light cursor-pointer",
        },
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: "mx-auto max-w-full h-auto my-4 rounded-sm",
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: "bg-surface-elevated rounded-sm p-4 font-mono text-sm overflow-x-auto",
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      CharacterCount,
    ],
    content: value || "",
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none font-body leading-relaxed focus:outline-none min-h-[300px] px-4 py-4",
      },
    },
    immediatelyRender: false,
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl })
      .run();
    setShowLinkInput(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (!editor || !imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setShowImageInput(false);
    setImageUrl("");
  }, [editor, imageUrl]);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;

      const form = new FormData();
      form.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();
        editor.chain().focus().setImage({ src: data.url }).run();
      } catch {
        console.error("Image upload failed");
      }
    },
    [editor],
  );

  // ToolbarButton and ToolbarDivider are defined at module level

  if (!isMounted) {
    return (
      <div className="min-h-[300px] w-full border border-border-subtle bg-surface">
        <div className="px-4 py-4 font-body text-muted">
          {locale === "fr" ? "Chargement de l'éditeur..." : "Loading editor..."}
        </div>
      </div>
    );
  }

  if (!editor) {
    return (
      <div className="min-h-[300px] w-full border border-border-subtle bg-surface">
        <div className="px-4 py-4 font-body text-muted">
          {locale === "fr" ? "Initialisation..." : "Initializing..."}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border border-border-subtle bg-surface">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border-subtle px-2 py-1.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title={locale === "fr" ? "Gras" : "Bold"}
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title={locale === "fr" ? "Italique" : "Italic"}
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title={locale === "fr" ? "Souligné" : "Underline"}
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title={locale === "fr" ? "Barré" : "Strikethrough"}
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive("heading", { level: 1 })}
          title={locale === "fr" ? "Titre 1" : "Heading 1"}
        >
          <Heading1 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title={locale === "fr" ? "Titre 2" : "Heading 2"}
        >
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title={locale === "fr" ? "Titre 3" : "Heading 3"}
        >
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title={locale === "fr" ? "Liste à puces" : "Bullet list"}
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title={locale === "fr" ? "Liste numérotée" : "Numbered list"}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title={locale === "fr" ? "Citation" : "Blockquote"}
        >
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          title={locale === "fr" ? "Code" : "Code block"}
        >
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => {
            const currentUrl = editor.getAttributes("link").href || "";
            setLinkUrl(currentUrl);
            setShowLinkInput(!showLinkInput);
          }}
          active={editor.isActive("link")}
          title={locale === "fr" ? "Lien" : "Link"}
        >
          {editor.isActive("link") ? (
            <Link2Off className="h-3.5 w-3.5" />
          ) : (
            <Link className="h-3.5 w-3.5" />
          )}
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setShowImageInput(!showImageInput)}
          active={showImageInput}
          title={locale === "fr" ? "Image" : "Image"}
        >
          <Image className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive("highlight")}
          title={locale === "fr" ? "Surligner" : "Highlight"}
        >
          <Highlighter className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title={locale === "fr" ? "Séparateur" : "Horizontal rule"}
        >
          <SeparatorHorizontal className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setParagraph().run()}
          active={editor.isActive("paragraph")}
          title={locale === "fr" ? "Paragraphe" : "Paragraph"}
        >
          <Pilcrow className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="ml-auto flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            title={locale === "fr" ? "Annuler" : "Undo"}
          >
            <Undo className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            title={locale === "fr" ? "Rétablir" : "Redo"}
          >
            <Redo className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>
      </div>

      {/* Link Input */}
      {showLinkInput && (
        <div className="flex items-center gap-2 border-b border-border-subtle bg-surface-newsprint px-3 py-2">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 border border-border-subtle bg-surface px-3 py-1.5 font-label text-sm focus:border-primary focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") setLink();
              if (e.key === "Escape") setShowLinkInput(false);
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={setLink}
            className="rounded-sm bg-foreground px-3 py-1.5 font-label text-xs font-bold text-background hover:bg-primary"
          >
            {locale === "fr" ? "Appliquer" : "Apply"}
          </button>
        </div>
      )}

      {/* Image Input */}
      {showImageInput && (
        <div className="space-y-2 border-b border-border-subtle bg-surface-newsprint px-3 py-2">
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder={locale === "fr" ? "URL de l'image..." : "Image URL..."}
              className="flex-1 border border-border-subtle bg-surface px-3 py-1.5 font-label text-sm focus:border-primary focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") addImage();
                if (e.key === "Escape") setShowImageInput(false);
              }}
              autoFocus
            />
            <button
              type="button"
              onClick={addImage}
              className="rounded-sm bg-foreground px-3 py-1.5 font-label text-xs font-bold text-background hover:bg-primary"
            >
              {locale === "fr" ? "Ajouter" : "Add"}
            </button>
          </div>
          <label className="flex cursor-pointer items-center gap-2 font-label text-xs text-muted hover:text-foreground">
            <span>{locale === "fr" ? "Ou uploader" : "Or upload"}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} ref={editorRef} />

      {/* Word/char count */}
      <div className="flex items-center justify-between border-t border-border-subtle px-4 py-1.5">
        <span className="font-label text-[10px] uppercase text-muted">
          {editor.storage.characterCount?.characters?.() || 0}{" "}
          {locale === "fr" ? "car." : "chars"} ·{" "}
          {editor.storage.characterCount?.words?.() || 0}{" "}
          {locale === "fr" ? "mots" : "words"}
        </span>
        <span className="font-label text-[10px] uppercase text-muted">
          HTML
        </span>
      </div>
    </div>
  );
}