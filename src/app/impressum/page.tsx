import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function ImpressumPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-12">
            <header className="sticky top-0 z-40 bg-transparent px-4 h-14 flex items-center gap-4">
                <Link href="/profile" className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-slate-700 transition-colors">
                    <ChevronLeft size={20} />
                </Link>
                <h1 className="font-bold text-lg">Impressum</h1>
            </header>

            <div className="max-w-prose mx-auto px-6 py-8 prose dark:prose-invert">
                <h2 className="text-xl font-bold mb-4">Angaben gemäß § 5 TMG</h2>
                <p>
                    Viktor Schilling<br />
                    Am Heiligenstock 21<br />
                    35305 Grünberg
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4">Kontakt</h2>
                <p>
                    Telefon: +49 6401-9059952<br />
                    E-Mail: vrsg@posteo.de
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
                <p>
                    Viktor Schilling<br />
                    Am Heiligenstock 21, 35305 Grünberg
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4">EU-Streitschlichtung</h2>
                <p>
                    Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
                    <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline ml-1">
                        https://ec.europa.eu/consumers/odr/
                    </a>.<br />
                    Unsere E-Mail-Adresse findest du oben im Impressum.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4">Verbraucherstreitbeilegung/Universalschlichtungsstelle</h2>
                <p>
                    Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
                </p>

                <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-slate-700 text-sm text-zinc-500">
                    <p>Quelle: <a href="https://www.e-recht24.de" target="_blank" rel="noopener noreferrer">e-recht24.de</a></p>
                </div>
            </div>
        </div>
    );
}
