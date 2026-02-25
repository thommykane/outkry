"use client";

import { useState, useRef } from "react";

const MAX_WORDS = 5000;
const MAX_LINKS = 3;

const IMAGE_ONLY_CATEGORIES = ["humor-funny-memes", "humor-funny-caps", "social-beautiful-people"];

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countLinks(text: string) {
  const urlRegex = /https?:\/\/[^\s<>\[\]()]+/gi;
  const matches = text.match(urlRegex);
  return matches ? matches.length : 0;
}

function linkify(text: string, maxLinks: number): { text: string; linkCount: number } {
  const urlRegex = /(https?:\/\/[^\s<>\[\]()]+)/gi;
  let linkCount = 0;
  const result = text.replace(urlRegex, (url) => {
    if (linkCount >= maxLinks) return url;
    linkCount++;
    return `<a href="${url}" target="_blank" rel="noopener" style="color: var(--gold-bright); text-decoration: underline;">${url}</a>`;
  });
  return { text: result, linkCount };
}

export default function PostForm({
  categoryId,
  onPostCreated,
}: {
  categoryId: string;
  onPostCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImageOnlyCategory = IMAGE_ONLY_CATEGORIES.includes(categoryId);
  const wordCount = countWords(body);
  const linkCount = countLinks(body);
  const overWordLimit = !isImageOnlyCategory && wordCount > MAX_WORDS;
  const overLinkLimit = !isImageOnlyCategory && linkCount > MAX_LINKS;

  const handleImageChange = (file: File | null) => {
    if (featuredImage) URL.revokeObjectURL(preview || "");
    setFeaturedImage(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleImageChange(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (overWordLimit || overLinkLimit) return;

    const formData = new FormData();
    formData.set("title", title);
    formData.set("body", isImageOnlyCategory ? "" : body);
    formData.set("categoryId", categoryId);
    if (featuredImage) formData.set("featuredImage", featuredImage);

    setLoading(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create post");
      setTitle("");
      setBody("");
      handleImageChange(null);
      onPostCreated();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel"
      style={{ padding: "0.6rem", marginBottom: "1rem" }}
    >
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        maxLength={300}
        style={{
          width: "100%",
          padding: "0.4rem 0.5rem",
          marginBottom: "0.4rem",
          background: "rgba(0,0,0,0.3)",
          border: "1px solid var(--glass-border)",
          borderRadius: "4px",
          color: "var(--gold-bright)",
          fontSize: "0.85rem",
        }}
      />

      {!isImageOnlyCategory && (
        <>
          <textarea
            placeholder="Body (5,000 words max). Paste URLs and they become clickable links. Max 3 links per post."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={3}
            style={{
              width: "100%",
              padding: "0.4rem 0.5rem",
              marginBottom: "0.3rem",
              background: "rgba(0,0,0,0.3)",
              border: "1px solid var(--glass-border)",
              borderRadius: "4px",
              color: "var(--gold-bright)",
              fontSize: "0.8rem",
              resize: "vertical",
              minHeight: "56px",
            }}
          />
          <div
            style={{
              fontSize: "0.65rem",
              color: overWordLimit ? "#e5534b" : overLinkLimit ? "#e5534b" : "var(--gold-dim)",
              marginBottom: "0.5rem",
            }}
          >
            {wordCount} / {MAX_WORDS} words · {linkCount} / {MAX_LINKS} links
          </div>
        </>
      )}

      {/* Featured image upload */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? "var(--gold)" : "var(--glass-border)"}`,
          borderRadius: "4px",
          padding: "0.5rem",
          textAlign: "center",
          cursor: "pointer",
          marginBottom: "0.5rem",
          background: dragOver ? "rgba(201,162,39,0.05)" : "rgba(0,0,0,0.2)",
          transition: "all 0.2s",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
          style={{ display: "none" }}
        />
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            style={{
              maxWidth: "80px",
              maxHeight: "50px",
              objectFit: "contain",
              borderRadius: "4px",
            }}
          />
        ) : (
          <span style={{ color: "var(--gold-dim)", fontSize: "0.7rem" }}>
            Drag & drop or click to upload image
          </span>
        )}
      </div>

      {error && (
        <div style={{ color: "#e5534b", fontSize: "0.75rem", marginBottom: "0.5rem" }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || overWordLimit || overLinkLimit}
        style={{
          padding: "0.4rem 0.8rem",
          fontSize: "0.8rem",
          background: "var(--glass)",
          border: "1px solid var(--gold)",
          borderRadius: "4px",
          color: "var(--gold-bright)",
          cursor: loading || overWordLimit || overLinkLimit ? "not-allowed" : "pointer",
          opacity: loading || overWordLimit || overLinkLimit ? 0.6 : 1,
        }}
      >
        {loading ? "Posting..." : "Post"}
      </button>
    </form>
  );
}
