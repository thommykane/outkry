import { requireAdmin } from "@/lib/admin";
import AdminPanel from "@/components/AdminPanel";

export default async function AdminPage() {
  const { user } = await requireAdmin();

  return (
    <div style={{ width: "100%" }}>
      <h1 style={{ marginBottom: "0.5rem", color: "var(--gold)" }}>Admin Panel</h1>
      <p style={{ color: "var(--gold-dim)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
        Logged in as {user.email}
      </p>
      <AdminPanel />
    </div>
  );
}
