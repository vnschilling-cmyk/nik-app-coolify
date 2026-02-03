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
  Poiret_One,
  Montserrat_Alternates,
  Jura,
  Sulphur_Point,
  Gruppo,
  Pompiere,
  Great_Vibes,
  Delius_Swash_Caps,
  Tinos,
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

// New Project Fonts
const poiretOne = Poiret_One({ subsets: ["latin"], weight: "400", variable: "--font-poiret-one" });
const montserratAlternates = Montserrat_Alternates({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-montserrat-alternates" });
const jura = Jura({ subsets: ["latin"], variable: "--font-jura" });
const sulphurPoint = Sulphur_Point({ subsets: ["latin"], weight: ["300", "400", "700"], variable: "--font-sulphur-point" });
const gruppo = Gruppo({ subsets: ["latin"], weight: "400", variable: "--font-gruppo" });
const pompiere = Pompiere({ subsets: ["latin"], weight: "400", variable: "--font-pompiere" });
const greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--font-great-vibes" });
const deliusSwashCaps = Delius_Swash_Caps({ subsets: ["latin"], weight: "400", variable: "--font-delius-swash-caps" });
const tinos = Tinos({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-tinos" });


export const metadata: Metadata = {
  title: "Nikodemus",
  description: "Mobile-First Bibelstudium PWA",

  manifest: "/manifest.json",
  icons: {
    icon: "/logo-light-head.png",
    apple: "/logo-light-head.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#fafafa",
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
          ${play.variable} 
          ${satisfy.variable}
          ${poiretOne.variable}
          ${montserratAlternates.variable}
          ${jura.variable}
          ${sulphurPoint.variable}
          ${gruppo.variable}
          ${pompiere.variable}
          ${greatVibes.variable}
          ${deliusSwashCaps.variable}
          ${tinos.variable}
    `}>
      <body
        className="antialiased bg-background text-foreground transition-colors duration-300"
      >
        <DesignProvider>
          <AuthWrapper>
            <main className="min-h-[calc(100vh-4rem)] pb-[env(safe-area-inset-bottom)] max-w-5xl mx-auto">
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
