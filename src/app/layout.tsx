import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "DR HAIR — Prontuário Digital",
  description: "Sistema de gestão clínica e prontuário digital para tratamento capilar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full bg-gray-50 font-sans">
        <Sidebar />
        <Header />
        <main className="md:ml-64 pt-16 min-h-screen">
          <div className="p-6">{children}</div>
        </main>
      </body>
    </html>
  );
}
