import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nikodämus",
  description: "Mobile-First Bibelstudium PWA",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${inter.className} antialiased bg-white dark:bg-black text-black dark:text-white`}
      >
        <main className="min-h-[calc(100vh-4rem)] pb-[env(safe-area-inset-bottom)]">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
