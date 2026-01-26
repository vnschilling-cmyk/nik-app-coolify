import type { Metadata, Viewport } from "next";
import { Montserrat, Outfit, Inter, Playfair_Display } from "next/font/google"; // Load all fonts
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import { DesignProvider } from "@/context/DesignContext";
import AttendanceSync from "@/components/features/AttendanceSync";

// Configure fonts
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

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
    <html lang="de" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${outfit.variable} ${inter.variable} ${playfair.variable} antialiased bg-background text-foreground transition-colors duration-300`}
      >
        <DesignProvider>
          <main className="min-h-[calc(100vh-4rem)] pb-[env(safe-area-inset-bottom)]">
            {children}
          </main>
          <BottomNav />
          <AttendanceSync />
        </DesignProvider>
      </body>
    </html>
  );
}
