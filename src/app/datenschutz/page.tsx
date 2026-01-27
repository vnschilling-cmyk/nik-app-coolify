import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function DatenschutzPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-12">
            <header className="sticky top-0 z-40 bg-background/80 dark:bg-slate-800/80 backdrop-blur-md px-4 h-14 flex items-center gap-4">
                <Link href="/profile" className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-slate-700 transition-colors">
                    <ChevronLeft size={20} />
                </Link>
                <h1 className="font-bold text-lg">Datenschutzerklärung</h1>
            </header>

            <div className="max-w-prose mx-auto px-6 py-8 prose dark:prose-invert text-sm leading-relaxed">
                <h2 className="text-xl font-bold mb-4">1. Datenschutz auf einen Blick</h2>
                <h3 className="font-bold mt-4">Allgemeine Hinweise</h3>
                <p>
                    Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen.
                    Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4">2. Datenerfassung auf dieser Website</h2>
                <h3 className="font-bold mt-4">Wer ist verantwortlich für die Datenerfassung?</h3>
                <p>
                    Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber (siehe Impressum).
                </p>

                <h3 className="font-bold mt-4">Wie erfassen wir Ihre Daten?</h3>
                <p>
                    Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z. B. um Daten handeln, die Sie in ein Kontaktformular oder bei der Registrierung eingeben.
                    Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst (z.B. IP-Adresse, Browser).
                </p>

                <h3 className="font-bold mt-4">Wofür nutzen wir Ihre Daten?</h3>
                <p>
                    Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4">3. Analyse-Tools und Tools von Drittanbietern</h2>
                <p>
                    <strong>Google AI (Gemini):</strong> Zur Bereitstellung von KI-basierten Funktionen (z.B. Bedeutungserklärung von Wörtern) werden Anfragen an Google APIs gesendet.
                    Dabei werden die von Ihnen eingegebenen Begriffe an Google übertragen. Wir achten darauf, keine unnötigen personenbezogenen Daten zu übermitteln.
                </p>

                <p>
                    <strong>Schriftarten:</strong> Diese Website nutzt lokale Schriftarten, die von unserem Server bereitgestellt werden. Es erfolgt keine Verbindung zu Google Fonts.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4">4. Ihre Rechte</h2>
                <p>
                    Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten.
                    Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen.
                </p>

                <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-slate-700 text-xs text-zinc-500">
                    <p>Hinweis: Dies ist eine vereinfachte Vorlage. Sie sollte gegebenenfalls durch einen Rechtsanwalt geprüft werden.</p>
                </div>
            </div>
        </div>
    );
}
