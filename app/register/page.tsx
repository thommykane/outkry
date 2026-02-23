"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, username, password, bio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      window.dispatchEvent(new Event("user-updated"));
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "2rem",
        }}
      >
        <h1 style={{ marginBottom: "1.5rem", color: "var(--gold)", textAlign: "center" }}>
          Register
        </h1>
        <p style={{ fontSize: "0.8rem", color: "var(--gold-dim)", marginBottom: "1rem" }}>
          Email & phone verification (placeholder – configure your providers later)
        </p>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "0.75rem",
            marginBottom: "0.75rem",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid var(--glass-border)",
            borderRadius: "6px",
            color: "var(--gold-bright)",
          }}
        />
        <input
          type="tel"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "0.75rem",
            marginBottom: "0.75rem",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid var(--glass-border)",
            borderRadius: "6px",
            color: "var(--gold-bright)",
          }}
        />
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          style={{
            width: "100%",
            padding: "0.75rem",
            marginBottom: "0.75rem",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid var(--glass-border)",
            borderRadius: "6px",
            color: "var(--gold-bright)",
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{
            width: "100%",
            padding: "0.75rem",
            marginBottom: "0.75rem",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid var(--glass-border)",
            borderRadius: "6px",
            color: "var(--gold-bright)",
          }}
        />
        <textarea
          placeholder="Short bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={2}
          style={{
            width: "100%",
            padding: "0.75rem",
            marginBottom: "1rem",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid var(--glass-border)",
            borderRadius: "6px",
            color: "var(--gold-bright)",
            resize: "vertical",
          }}
        />
        {error && (
          <div style={{ color: "#e5534b", fontSize: "0.85rem", marginBottom: "1rem" }}>
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.75rem",
            background: "var(--glass)",
            border: "1px solid var(--gold)",
            borderRadius: "6px",
            color: "var(--gold-bright)",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creating account..." : "Register"}
        </button>
        <p style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.85rem", color: "var(--gold-dim)" }}>
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
