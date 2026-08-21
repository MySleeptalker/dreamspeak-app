import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dreamspeak Admin",
  description: "CRM dashboard for Dreamspeak users",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-muted/30">{children}</div>;
}
