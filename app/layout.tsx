import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import AppLayout from "@/components/AppLayout";

async function getMetadataBase() {
  const headersList = await headers();
  const host = headersList.get("host");
  if (host) {
    const proto = headersList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    return new URL(`${proto}://${host}`);
  }
  const env = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000";
  const url = env.startsWith("http") ? env : `https://${env}`;
  return new URL(url);
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: await getMetadataBase(),
    title: "Outkry",
    description: "Expression · Debate · Community · Ownership",
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="bg-layer" />
        <div className="overlay" />
        <div style={{ position: "relative", zIndex: 2, minHeight: "100vh" }}>
          <AppLayout>{children}</AppLayout>
        </div>
      </body>
    </html>
  );
}
