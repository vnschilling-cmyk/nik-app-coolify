import type { Metadata, Viewport } from "next";
import {
  Montserrat,
  Raleway,
  Ubuntu,
  Quicksand,
  Smooch_Sans,
  Dancing_Script,
  Lobster_Two,
  Exo_2,
  Comfortaa,
  Play,
  Satisfy,
  // Momo_Signature - Not standard in generic imports, removing to fix error.
} from "next/font/google"; // Load all fonts
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import { DesignProvider } from "@/context/DesignContext";
import AttendanceSync from "@/components/features/AttendanceSync";
import AuthWrapper from "@/components/auth/AuthWrapper";
import ForcePasswordChange from "@/components/auth/ForcePasswordChange";

// Configure fonts
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway" });
const ubuntu = Ubuntu({ subsets: ["latin"], weight: ["300", "400", "500", "700"], variable: "--font-ubuntu" });
const quicksand = Quicksand({ subsets: ["latin"], variable: "--font-quicksand" });
const smoochSans = Smooch_Sans({ subsets: ["latin"], variable: "--font-smooch-sans" });
const dancingScript = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing-script" });
const lobsterTwo = Lobster_Two({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-lobster-two" });
const exo2 = Exo_2({ subsets: ["latin"], variable: "--font-exo-2" });
const comfortaa = Comfortaa({ subsets: ["latin"], variable: "--font-comfortaa" });
const play = Play({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-play" });
const satisfy = Satisfy({ subsets: ["latin"], weight: "400", variable: "--font-satisfy" });
// Momo Signature skipped for now.


export const metadata: Metadata = {
  title: "Nikodemus",
  description: "Mobile-First Bibelstudium PWA",

  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#1e293b",
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
    <html lang="de" suppressHydrationWarning className={`
          ${montserrat.variable} 
          ${raleway.variable} 
          ${ubuntu.variable} 
          ${quicksand.variable} 
          ${smoochSans.variable} 
          ${dancingScript.variable} 
          ${lobsterTwo.variable} 
          ${exo2.variable} 
          ${comfortaa.variable} 
          ${play.variable} 
          ${satisfy.variable}
    `}>
      <body
        className="antialiased bg-background text-foreground transition-colors duration-300"
      >
        <DesignProvider>
          <AuthWrapper>
            <main className="min-h-[calc(100vh-4rem)] pb-[env(safe-area-inset-bottom)]">
              {children}
            </main>
            <BottomNav />
            <AttendanceSync />
            <ForcePasswordChange />
          </AuthWrapper>
        </DesignProvider>
      </body>
    </html>
  );
}
