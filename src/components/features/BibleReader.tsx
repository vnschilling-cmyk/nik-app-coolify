"use client";

import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { LinkedLesson } from "@/lib/bible";
import { findMeasure, parseGermanNumber, Unit, ANCIENT_MEASURES } from "@/lib/measures";
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
        <article className="max-w-prose mx-auto px-4 py-6 dark:text-zinc-200 relative bible-text">
            {verses.map((v) => {
                // Find lessons starting at this verse
                const currentLessons = lessons.filter(l => l.verse_start === v.verse);

                return (
                    <div key={v.verse} className="relative group">
                        <p className="mb-4 relative pr-8">
                            <span className="text-xs font-bold text-blue-500 mr-1 select-none align-top pt-1 inline-block">
                                {v.verse}
                            </span>
                            {renderInteractiveText(v.text)}
                        </p>

                        {/* Lesson Icons in Right Margin */}
                        {currentLessons.length > 0 && (
                            <div className="absolute right-0 top-1 flex flex-col gap-2 transform translate-x-2">
                                {currentLessons.map(lesson => (
                                    <Link
                                        key={lesson.id}
                                        href={`/study/${lesson.id}`}
                                        className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300 p-1.5 rounded-full shadow-sm hover:scale-110 transition-transform cursor-pointer"
                                        title={lesson.title}
                                    >
                                        <GraduationCap size={18} />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            <div className="h-20" />

            {/* Measure Info Modal */}
            {selectedMeasure && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedMeasure(null)}>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-zinc-200 dark:border-zinc-800 relative animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
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
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 space-y-3">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1">Umrechnung</p>
                                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                        {selectedMeasure.quantity > 1 ? `${selectedMeasure.quantity.toLocaleString('de-DE')} x ` : ""}
                                        1 {selectedMeasure.unit.name.split(" ")[0]} ≈ {(selectedMeasure.quantity * selectedMeasure.unit.factor).toLocaleString('de-DE', { maximumFractionDigits: 2 })} {selectedMeasure.unit.unit}
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
