"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Undo, Redo, Code, Strikethrough, Underline as UnderlineIcon,
  Link, Image, AlignLeft, AlignCenter, AlignRight, Minus, Pilcrow, Loader2
} from "lucide-react";
import { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from "react";

export interface RichTextEditorHandle {
  /** Upload all pending (data URL) images to Cloudinary, replace them in the editor, and return the final HTML */
  processPendingImages: () => Promise<string>;
}

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

/** Extract the Cloudinary publicId from a Cloudinary image URL */
function publicIdFromUrl(url: string): string | null {
  const match = url.match(/\/image\/upload\/(?:v\d+\/)?(.+)/);
  return match ? match[1] : null;
}

/** Extract all <img src="..."> URLs from HTML */
function extractImageUrls(html: string): string[] {
  const urls: string[] = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  function RichTextEditor({ content, onChange, placeholder }, ref) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  // Track all image URLs currently in the editor content (Cloudinary + data URLs)
  const trackedUrlsRef = useRef<string[]>(extractImageUrls(content));
  // Track pending (data URL → File) for images not yet uploaded to Cloudinary
  const pendingImagesRef = useRef<Record<string, File>>({});

  // Sync tracked URLs when content changes externally
  useEffect(() => {
    trackedUrlsRef.current = extractImageUrls(content);
  }, [content]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
      }),
      Underline,
      TextStyle,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ImageExtension.configure({ inline: false }),
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder || "Start writing..." }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const newHtml = editor.getHTML();
      const newUrls = extractImageUrls(newHtml);
      const oldUrls = trackedUrlsRef.current;

      // Detect Cloudinary images that were removed by the user and delete from Cloudinary
      for (const url of oldUrls) {
        if (!newUrls.includes(url) && !url.startsWith("data:")) {
          const publicId = publicIdFromUrl(url);
          if (publicId) {
            fetch("/api/delete-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ publicId }),
            }).catch(() => {});
          }
        }
      }

      // If a data URL was removed, stop tracking the pending file
      for (const url of oldUrls) {
        if (!newUrls.includes(url) && url.startsWith("data:")) {
          delete pendingImagesRef.current[url];
        }
      }

      trackedUrlsRef.current = newUrls;
      onChange(newHtml);
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[300px] px-4 py-3 focus:outline-none",
      },
    },
  });

  // Expose processPendingImages to parent forms
  useImperativeHandle(ref, () => ({
    async processPendingImages() {
      if (!editor) return "";
      const pending = pendingImagesRef.current;
      const entries = Object.entries(pending);
      if (entries.length === 0) return editor.getHTML();

      let html = editor.getHTML();
      for (const [dataUrl, file] of entries) {
        try {
          const fd = new FormData();
          fd.set("file", file);
          fd.set("folder", "mardi-treks/content");
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          const data = await res.json();
          const cloudinaryUrl = data.publicId
            ? `https://res.cloudinary.com/dk7ggjvlw/image/upload/${data.publicId}`
            : data.url;

          if (cloudinaryUrl) {
            html = html.replaceAll(dataUrl, cloudinaryUrl);
          }
        } catch (err) {
          console.error("Failed to upload pending editor image", err);
        }
      }

      // Update editor content with Cloudinary URLs (triggers onUpdate → onChange)
      editor.commands.setContent(html);
      pendingImagesRef.current = {};
      return html;
    },
  }), [editor, onChange]);

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    setUploading(true);
    // Read file as data URL for local preview — no Cloudinary upload yet
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      editor.chain().focus().setImage({ src: dataUrl }).run();
      // Track for later upload
      pendingImagesRef.current[dataUrl] = file;
      trackedUrlsRef.current = extractImageUrls(editor.getHTML());
      setUploading(false);
    };
    reader.onerror = () => {
      console.error("Failed to read file");
      setUploading(false);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [editor]);

  const handleSetLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl("");
      setShowLinkInput(false);
    }
  }, [editor, linkUrl]);

  const handleRemoveLink = useCallback(() => {
    editor?.chain().focus().unsetLink().run();
    setShowLinkInput(false);
    setLinkUrl("");
  }, [editor]);

  if (!editor) return null;

  const ToolButton = ({ onClick, active, children, title }: any) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-lg p-1.5 transition-all ${
        active
          ? "bg-teal-100 text-teal-700 shadow-sm"
          : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      }`}
    >
      {children}
    </button>
  );

  const Divider = () => <span className="mx-0.5 h-5 w-px bg-slate-200" />;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 bg-slate-50/80 px-2 py-1.5">
        {/* Text Formatting */}
        <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (Ctrl+B)">
          <Bold className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (Ctrl+I)">
          <Italic className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
          <UnderlineIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
          <Strikethrough className="h-4 w-4" />
        </ToolButton>

        <Divider />

        {/* Headings */}
        <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
          <Heading1 className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
          <Heading2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
          <Heading3 className="h-4 w-4" />
        </ToolButton>

        <Divider />

        {/* Lists */}
        <ToolButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
          <List className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered List">
          <ListOrdered className="h-4 w-4" />
        </ToolButton>

        <Divider />

        {/* Alignment */}
        <ToolButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left">
          <AlignLeft className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center">
          <AlignCenter className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right">
          <AlignRight className="h-4 w-4" />
        </ToolButton>

        <Divider />

        {/* Block Elements */}
        <ToolButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
          <Quote className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code Block">
          <Code className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="Horizontal Rule">
          <Minus className="h-4 w-4" />
        </ToolButton>

        <Divider />

        {/* Link & Image */}
        <div className="relative">
          <ToolButton
            onClick={() => {
              if (editor.isActive("link")) {
                handleRemoveLink();
              } else {
                setShowLinkInput(!showLinkInput);
                if (editor.state.selection.empty) {
                  setLinkUrl("");
                } else {
                  const href = editor.getAttributes("link").href || "";
                  setLinkUrl(href);
                }
              }
            }}
            active={editor.isActive("link")}
            title="Link"
          >
            <Link className="h-4 w-4" />
          </ToolButton>
          {showLinkInput && (
            <div className="absolute left-0 top-full z-10 mt-1 flex w-64 items-center gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                onKeyDown={(e) => e.key === "Enter" && handleSetLink()}
              />
              <button
                type="button"
                onClick={handleSetLink}
                className="rounded-lg bg-teal-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-teal-600"
              >
                Set
              </button>
              <button
                type="button"
                onClick={handleRemoveLink}
                className="rounded-lg px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100"
              >
                X
              </button>
            </div>
          )}
        </div>

        <ToolButton onClick={handleImageUpload} active={false} title={uploading ? "Uploading..." : "Upload Image"}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
        </ToolButton>

        {/* Hidden file input for image upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelected}
        />

        <div className="ml-auto flex items-center gap-0.5">
          <Divider />
          <ToolButton onClick={() => editor.chain().focus().undo().run()} active={false} title="Undo (Ctrl+Z)">
            <Undo className="h-4 w-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().redo().run()} active={false} title="Redo (Ctrl+Shift+Z)">
            <Redo className="h-4 w-4" />
          </ToolButton>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
});
