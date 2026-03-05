import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Plataforma de BI",
  description: "Plataforma avançada de BI e Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex h-screen w-full bg-background overflow-hidden relative">
          <Sidebar />
          <div className="flex flex-1 flex-col md:pl-64 min-w-0">
            <Header />
            <main className="flex-1 flex flex-col min-h-0 relative overflow-y-auto">
              <div className="p-3 md:p-6 w-full flex-1 flex flex-col min-h-0">
                {children}
              </div>
            </main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
