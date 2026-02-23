"use client";

import { useState, useRef } from "react";

export default function AvatarUpload({
  currentAvatarUrl,
  onUploaded,
}: {
  currentAvatarUrl: string | null;
  onUploaded?: (url: string) => void;
}) {
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    setPreview(URL.createObjectURL(file));
    setLoading(true);

    const formData = new FormData();
    formData.set("avatar", file);

    try {
      const res = await fetch("/api/profile/avatar", {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setPreview(data.avatarUrl);
        onUploaded?.(data.avatarUrl);
        window.dispatchEvent(new Event("user-updated"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div
        onClick={() => fileInputRef.current?.click()}
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          overflow: "hidden",
          background: "var(--glass)",
          border: "2px dashed var(--glass-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: loading ? "wait" : "pointer",
          position: "relative",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          style={{ display: "none" }}
        />
        {preview ? (
          <img
            src={preview}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ fontSize: "0.7rem", color: "var(--gold-dim)", textAlign: "center", padding: "0.25rem" }}>
            {loading ? "..." : "Upload"}
          </span>
        )}
      </div>
      <p style={{ fontSize: "0.75rem", color: "var(--gold-dim)", marginTop: "0.25rem" }}>
        Click to change photo
      </p>
    </div>
  );
}
