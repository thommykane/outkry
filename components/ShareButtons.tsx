"use client";

import { useState } from "react";

export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const fullUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const encodedUrl = encodeURIComponent(fullUrl);
  const textWithLink = `${title}\n\n${fullUrl}`;
  const encodedText = encodeURIComponent(textWithLink);

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, "_blank", "width=600,height=400");
  };

  const copyLink = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement("input");
      input.value = fullUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareViaText = () => {
    if (typeof window === "undefined") return;
    window.location.href = `sms:?body=${encodedText}`;
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        marginTop: "1.25rem",
        paddingTop: "1rem",
        borderTop: "1px solid var(--glass-border)",
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: "0.85rem", color: "var(--gold-dim)" }}>Share:</span>
      <button
        type="button"
        onClick={shareOnFacebook}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: "0.4rem 0.75rem",
          fontSize: "0.85rem",
          background: "var(--glass)",
          border: "1px solid var(--glass-border)",
          borderRadius: "6px",
          color: "var(--gold-bright)",
          cursor: "pointer",
        }}
      >
        Facebook
      </button>
      <button
        type="button"
        onClick={shareViaText}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: "0.4rem 0.75rem",
          fontSize: "0.85rem",
          background: "var(--glass)",
          border: "1px solid var(--glass-border)",
          borderRadius: "6px",
          color: "var(--gold-bright)",
          cursor: "pointer",
        }}
      >
        Text message
      </button>
      <button
        type="button"
        onClick={copyLink}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: "0.4rem 0.75rem",
          fontSize: "0.85rem",
          background: "var(--glass)",
          border: "1px solid var(--glass-border)",
          borderRadius: "6px",
          color: copied ? "var(--gold)" : "var(--gold-bright)",
          cursor: "pointer",
        }}
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
