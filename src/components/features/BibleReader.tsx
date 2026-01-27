"use client";

import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { LinkedLesson } from "@/lib/bible";
import { findMeasure, parseGermanNumber, formatBestUnit, Unit, ANCIENT_MEASURES } from "@/lib/measures";
import { Calculator, X, Coins } from "lucide-react";

export interface VerseData {
    verse: number;
    text: string;
}

interface BibleReaderProps {
    verses: VerseData[];
    lessons?: LinkedLesson[];
    onWordClick: (word: string) => void;
}

export default function BibleReader({ verses, lessons = [], onWordClick }: BibleReaderProps) {
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [selectedMeasure, setSelectedMeasure] = useState<{ unit: Unit, originalWord: string, quantity: number } | null>(null);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
                setIsHeaderVisible(false);
            } else {
                setIsHeaderVisible(true);
            }
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Helper to render text with clickable words
    const renderInteractiveText = (text: string) => {
        const words = text.split(/(\s+|[.,;!?]+)/g); // Keep punctuation but separate
        return words.map((chunk, i) => {
            // If it's whitespace, just render it
            if (/^\s+$/.test(chunk)) return <span key={i}>{chunk}</span>;

            // If it's punctuation, render it non-clickable
            if (/^[.,;!?]+$/.test(chunk)) return <span key={i} className="text-zinc-500">{chunk}</span>;

            // Check if it's a measure
            const measureMatch = findMeasure(chunk);

            // Check for quantity in previous word
            let quantity = 1;
            if (measureMatch && i > 0) {
                let prevIndex = i - 1;
                // Skip whitespace
                while (prevIndex >= 0 && /^\s+$/.test(words[prevIndex])) {
                    prevIndex--;
                }
                if (prevIndex >= 0) {
                    const prevWord = words[prevIndex];
                    const parsed = parseGermanNumber(prevWord);
                    if (parsed) {
                        quantity = parsed;
                    }
                }
            }

            // It's a word
            return (
                <span key={i} className="inline-flex items-baseline flex-wrap">
                    <span
                        onClick={() => onWordClick(chunk)}
                        className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded px-0.5 transition-colors select-none"
                    >
                        {chunk}
                    </span>
                    {measureMatch && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMeasure({ unit: measureMatch.unit, originalWord: chunk, quantity });
                            }}
                            className="ml-0.5 inline-flex items-center justify-center p-0.5 text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30 rounded-full hover:bg-amber-100 dark:hover:bg-amber-800 transition-colors align-super"
                            title={`Maßeinheit: ${measureMatch.unit.name}`}
                        >
                            <Calculator size={10} />
                        </button>
                    )}
                </span>
            );
        });
    };

    return (
        <article className="w-full px-4 py-6 dark:text-zinc-200 relative bible-text" lang="de">
            {verses.map((v) => {
                // Determine which lesson is the "next possible" one across all lessons
                // (This could be cached outside the map if performance is an issue, but for a chapter it's fine)
                const now = new Date();
                const buffer = 600000; // 10 min 

                const activeFutureLessons = lessons
                    .filter(l => l.active && l.start_date && (new Date(l.start_date).getTime() > now.getTime() + buffer))
                    .sort((a, b) => new Date(a!.start_date!).getTime() - new Date(b!.start_date!).getTime());

                const nextPossibleId = activeFutureLessons.length > 0 ? activeFutureLessons[0].id : null;

                // Find lessons starting at this verse
                const currentLessons = lessons
                    .filter(l => Number(l.verse_start) === v.verse)
                    .map(l => {
                        const lessonDate = l.start_date ? new Date(l.start_date).getTime() : 0;
                        const isDateReached = !l.start_date || (lessonDate <= now.getTime() + buffer);
                        const isNextPossible = l.id === nextPossibleId;

                        const isActiveFlag = l.active === true || l.active === undefined;
                        // Effectively active if date is reached OR it's the next one in line
                        const isEffectivelyActive = isActiveFlag && (isDateReached || isNextPossible);

                        let statusText = isActiveFlag ? 'Aktiv' : 'Deaktiviert';
                        if (isActiveFlag && !isDateReached) {
                            statusText = isNextPossible ? 'Nächste (Vorab freigeschaltet)' : 'Geplant (Zukünftig)';
                        }

                        const debugTitle = `Lektion: ${l.title}\n` +
                            `Status: ${statusText}\n` +
                            `Datum: ${l.start_date ? new Date(l.start_date).toLocaleString() : 'Keins'}\n` +
                            `Klickbar: ${isEffectivelyActive ? 'JA' : 'NEIN'}`;

                        return { ...l, isEffectivelyActive, isNextPossible, debugTitle };
                    })
                    .sort((a, b) => {
                        if (a.isEffectivelyActive !== b.isEffectivelyActive) return a.isEffectivelyActive ? -1 : 1;
                        return (a.start_date || '') > (b.start_date || '') ? 1 : -1;
                    });

                return (
                    <div key={v.verse} className="relative group mb-6">
                        <p className="text-justify leading-relaxed hyphens-auto whitespace-pre-wrap">
                            {/* Lesson Icons Floated in Right Margin */}
                            {currentLessons.length > 0 && (
                                <span className="float-right ml-4 mb-2 flex flex-col gap-3">
                                    {currentLessons.map(lesson => {
                                        if (!lesson.isEffectivelyActive) {
                                            return (
                                                <span
                                                    key={lesson.id}
                                                    className="bg-zinc-100 dark:bg-slate-700/80 text-zinc-400 dark:text-slate-300 p-2.5 rounded-full shadow-md cursor-not-allowed border-2 border-zinc-200 dark:border-slate-600 transition-opacity flex items-center justify-center"
                                                    title={lesson.debugTitle}
                                                >
                                                    <GraduationCap size={24} strokeWidth={2.5} />
                                                </span>
                                            );
                                        }
                                        return (
                                            <Link
                                                key={lesson.id}
                                                href={`/study/${lesson.id}`}
                                                className="bg-indigo-600 text-white p-2.5 rounded-full shadow-xl shadow-indigo-600/40 hover:scale-110 hover:bg-indigo-500 transition-all cursor-pointer ring-4 ring-white dark:ring-zinc-900 flex items-center justify-center"
                                                title={lesson.debugTitle}
                                            >
                                                <GraduationCap size={24} strokeWidth={2.5} />
                                            </Link>
                                        );
                                    })}
                                </span>
                            )}

                            <span className="text-xs font-bold text-blue-500 mr-2 select-none align-top pt-1 inline-block">
                                {v.verse}
                            </span>
                            {renderInteractiveText(v.text)}
                        </p>
                    </div>
                );
            })}

            <div className="h-20" />

            {/* Measure Info Modal */}
            {selectedMeasure && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedMeasure(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-zinc-200 dark:border-slate-700 relative animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedMeasure(null)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center">
                                <Calculator size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{selectedMeasure.unit.name}</h3>
                                <p className="text-sm text-zinc-500">
                                    Im Text: "{selectedMeasure.quantity > 1 ? `${selectedMeasure.quantity} ` : ""}{selectedMeasure.originalWord}"
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-zinc-50 dark:bg-slate-700/40 rounded-xl p-4 border border-zinc-100 dark:border-slate-700 space-y-3">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1">Umrechnung</p>
                                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                        {selectedMeasure.quantity > 1 ? `${selectedMeasure.quantity.toLocaleString('de-DE')} x ` : ""}
                                        1 {selectedMeasure.unit.name.split(" ")[0]} ≈ {formatBestUnit(selectedMeasure.quantity * selectedMeasure.unit.factor, selectedMeasure.unit.unit)}
                                    </p>
                                </div>

                                {selectedMeasure.unit.purchasingPower && (
                                    <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
                                        <p className="text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold mb-1 flex items-center gap-1">
                                            <Coins size={12} /> Kaufkraft heute (DE)
                                        </p>
                                        <p className="text-xl font-bold text-zinc-900 dark:text-white">
                                            ≈ {(selectedMeasure.quantity * selectedMeasure.unit.purchasingPower).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                                        </p>
                                        <p className="text-[10px] text-zinc-400 mt-1">
                                            *Basierend auf einem Tageslohn (Mindestlohn) von ca. {ANCIENT_MEASURES.money.units.denar.purchasingPower}€.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                    {selectedMeasure.unit.description}
                                </p>
                                {selectedMeasure.unit.biblical && (
                                    <p className="mt-2 text-xs text-zinc-400 italic">
                                        📖 {selectedMeasure.unit.biblical}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </article>
    );
}
