"use client";

import BibleReader from "@/components/features/BibleReader";

const DEMO_TEXT = `
Im Anfang war das Wort, und das Wort war bei Gott, und Gott war das Wort.
Dasselbe war im Anfang bei Gott.
Alle Dinge sind durch dasselbe gemacht, und ohne dasselbe ist nichts gemacht, was gemacht ist.
In ihm war das Leben, und das Leben war das Licht der Menschen.
Und das Licht scheint in der Finsternis, und die Finsternis hat's nicht ergriffen.
`;

export default function BiblePage() {
    const handleWordClick = (word: string) => {
        console.log("Word clicked:", word);
        // TODO: Open Gemini Bottom Sheet
        alert(`KI Analyse für: "${word}"`);
    };

    return (
        <div className="">
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 h-14 flex items-center justify-between">
                <h1 className="font-semibold text-lg">Johannes 1</h1>
                <button className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Kapitel
                </button>
            </header>

            <BibleReader text={DEMO_TEXT} onWordClick={handleWordClick} />
        </div>
    );
}
