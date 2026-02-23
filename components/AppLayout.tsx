"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const showSidebar = !pathname.startsWith("/login") && !pathname.startsWith("/register");
  const showHeader = !pathname.startsWith("/login") && !pathname.startsWith("/register");

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      {showSidebar && <Sidebar />}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {showHeader && <Header />}
        <main style={{ flex: 1, padding: "1.5rem" }}>{children}</main>
      </div>
    </div>
  );
}
