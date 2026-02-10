"use client";

import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { GraduationCap, Lightbulb, HelpCircle } from "lucide-react";
import Link from "next/link";
import { LinkedLesson, ChapterFact, ChapterQuestion } from "@/lib/bible";
import { findMeasure, parseGermanNumber, formatBestUnit, Unit, ANCIENT_MEASURES } from "@/lib/measures";
import { Calculator, X, Coins } from "lucide-react";

export interface VerseData {
    verse: number;
    text: string;
}

interface BibleReaderProps {
    verses: VerseData[];
    lessons?: LinkedLesson[];
    wordStudies?: LinkedLesson[];
    facts?: ChapterFact[];
    questions?: ChapterQuestion[];
    textStudies?: any[];
    onWordClick: (word: string) => void;
    onVerseClick?: (verse: number) => void;
    onFactClick?: (fact: any) => void;
    onQuestionClick?: (question: ChapterQuestion) => void;
    searchQuery?: string;
    showLessons?: boolean;
    chapter?: number;
}

export default function BibleReader({ verses, lessons = [], wordStudies = [], facts = [], questions = [], textStudies = [], onWordClick, onVerseClick, onFactClick, onQuestionClick, searchQuery, showLessons = true, chapter = 1 }: BibleReaderProps) {
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

            // Clean the word for lookup
            const cleanWord = chunk.replace(/[.,;!?"'()\[\]]/g, '').trim().toLowerCase();
            const wordStudy = wordStudies?.find(l =>
                l.category === 'Wortstudie' &&
                (l as any).word?.toLowerCase() === cleanWord
            );

            // Is it the searched word?
            const isMatch = searchQuery && cleanWord === searchQuery.toLowerCase();

            // It's a word study word
            if (wordStudy) {
                return (
                    <span
                        key={i}
                        onClick={() => onWordClick(chunk)}
                        className={clsx(
                            "cursor-pointer transition-all inline p-1 -m-1 rounded-sm decoration-clone",
                            isMatch
                                ? "bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 border-b-2 border-amber-500 rounded px-1 py-0.5 font-bold"
                                : "text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300"
                        )}
                    >
                        {chunk}
                    </span>
                );
            }

            // It's a normal word
            if (!measureMatch) {
                return (
                    <span
                        key={i}
                        onClick={() => onWordClick(chunk)}
                        className={clsx(
                            "cursor-pointer rounded px-1 -mx-1 py-0.5 transition-all inline decoration-clone",
                            isMatch
                                ? "bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 font-bold"
                                : "hover:bg-blue-100 dark:hover:bg-blue-900/50 active:bg-blue-200 dark:active:bg-blue-800"
                        )}
                    >
                        {chunk}
                    </span>
                );
            }

            return (
                <span key={i} className="inline-flex items-baseline flex-nowrap mb-0.5">
                    <span
                        onClick={() => onWordClick(chunk)}
                        className={clsx(
                            "cursor-pointer rounded px-1 -mx-1 py-0.5 transition-all inline decoration-clone",
                            isMatch
                                ? "bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 font-bold"
                                : "hover:bg-blue-100 dark:hover:bg-blue-900/50 active:bg-blue-200 dark:active:bg-blue-800"
                        )}
                    >
                        {chunk}
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMeasure({ unit: measureMatch.unit, originalWord: chunk, quantity });
                        }}
                        className="ml-0.5 inline-flex items-center justify-center p-1 text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30 rounded-full hover:bg-amber-100 dark:hover:bg-amber-800 transition-colors align-super shrink-0"
                        title={`Maßeinheit: ${measureMatch.unit.name}`}
                    >
                        <Calculator size={12} />
                    </button>
                </span>
            );
        });
    };

    return (
        <article className="w-full px-4 py-6 dark:text-zinc-200 relative bible-text" lang="de">
            {verses.map((v) => {
                const hasKIAnalysis = textStudies.some(s => s.verse_start === v.verse && s.category === 'KI');
                // Filter lessons that start at this specific verse
                const startingLessons = showLessons ? lessons.filter(l => {
                    // Regular lesson starting here
                    const isNormalStart = l.chapter_start === chapter && l.verse_start === v.verse;
                    // Global book lesson (chapter_start=0) starts at Chap 1, Vers 1
                    const isGlobalStart = l.chapter_start === 0 && chapter === 1 && v.verse === 1;

                    return isNormalStart || isGlobalStart;
                }) : [];

                return (
                    <div key={v.verse} id={`v${v.verse}`} className="relative group mb-6 scroll-mt-20">
                        <p
                            className="text-justify leading-relaxed whitespace-pre-wrap hyphens-auto break-words"
                            lang="de"
                            style={{
                                textJustify: 'auto'
                            }}
                        >
                            {/* Lesson Links (Floating Right Stack) */}
                            {startingLessons.length > 0 && (
                                <div className="float-right flex flex-col gap-2 ml-4 mb-2 mt-1 relative z-10">
                                    {startingLessons.map(lesson => (
                                        <Link
                                            key={lesson.id}
                                            href={`/study/${lesson.id}`}
                                            className="flex items-center justify-center w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full shadow-sm hover:shadow-md hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-all group/lesson scale-90 sm:scale-100"
                                            title={`Lektion: ${lesson.title}`}
                                        >
                                            <GraduationCap size={20} className="group-hover/lesson:scale-110 transition-transform" />
                                            <div className="absolute right-full mr-3 px-2 py-1 bg-zinc-900 text-white text-[10px] rounded opacity-0 group-hover/lesson:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-white/10">
                                                {lesson.title} öffnen
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center gap-1.5 align-top pt-1 inline-block">
                                {/* Vers Number and Analysis Button */}
                                <button
                                    onClick={() => onVerseClick?.(v.verse)}
                                    className={clsx(
                                        "text-sm font-black p-3 -m-3 select-none hover:scale-125 active:scale-90 transition-all cursor-pointer",
                                        hasKIAnalysis
                                            ? "bg-indigo-600 text-white rounded-lg px-2.5 py-1 -mt-1 shadow-lg shadow-indigo-600/30"
                                            : "text-indigo-500/80 dark:text-indigo-400/80"
                                    )}
                                    title={hasKIAnalysis ? `Analyse anzeigen (Vers ${v.verse})` : `Vers ${v.verse} analysieren`}
                                >
                                    {v.verse}
                                </button>
                            </div>
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
                            aria-label="Schließen"
                            title="Schließen"
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
