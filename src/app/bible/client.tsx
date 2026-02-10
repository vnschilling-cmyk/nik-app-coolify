"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import NextImage from "next/image";
import BibleReader, { VerseData } from "@/components/features/BibleReader";
import ChapterSelector from "@/components/features/ChapterSelector";
import WordMeaningPopup from "@/components/features/WordMeaningPopup";
import Link from "next/link";
import clsx from "clsx";
import { LinkedLesson, ChapterFact, ChapterQuestion } from "@/lib/bible";
import { Search, BookOpen, Lightbulb, HelpCircle, X, GraduationCap } from "lucide-react";
import SearchModal from "@/components/features/SearchModal";
import { useSearchParams, useRouter } from "next/navigation";
import AnalysisModal from "@/components/features/AnalysisModal";
import { Sparkles as SparklesIcon, Users, User, Shield } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

interface BookSummary {
    id: string;
    name: string;
    short_name: string;
    chapters: number;
    testament: 'OT' | 'NT';
    order: number;
}

interface BiblePageClientProps {
    verses: VerseData[];
    lessons: LinkedLesson[];
    textStudies: any[];
    facts: ChapterFact[];
    questions: ChapterQuestion[];
    book: BookSummary;
    chapter: number;
    allBooks: BookSummary[];
}

export default function BiblePageClient({ verses, lessons, textStudies, facts, questions, book, chapter, allBooks }: BiblePageClientProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { canAccessPage } = usePermissions();
    const searchQuery = searchParams.get('q') || undefined;

    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [showLessons, setShowLessons] = useState(true);

    if (!canAccessPage("bible")) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-3xl flex items-center justify-center text-red-600 dark:text-red-400 mb-6 shadow-xl shadow-red-500/10 scale-110">
                    <Shield size={40} />
                </div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-3 uppercase tracking-tight">Zugriff verweigert</h2>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                    Du hast keine Berechtigung, die Bibel zu lesen. Bitte wende dich an die Jugendleitung.
                </p>
                <Link
                    href="/dashboard"
                    className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    Zum Dashboard
                </Link>
            </div>
        );
    }
    const [selectorMode, setSelectorMode] = useState<'books' | 'chapters'>('books');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [selectedWord, setSelectedWord] = useState<string | null>(null);
    const [analysisConfig, setAnalysisConfig] = useState<{
        isOpen: boolean;
        type: 'chapter' | 'verse';
        category?: 'KI' | 'Andere' | 'Eigene';
        verse?: number
    }>({ isOpen: false, type: 'chapter' });

    // 1. Redirection to last read position
    useEffect(() => {
        const hasParams = searchParams.has('book') || searchParams.has('chapter');
        if (!hasParams && typeof window !== 'undefined') {
            const saved = localStorage.getItem('lastReadPosition');
            if (saved) {
                try {
                    const { bookShortName, chapter: savedChapter } = JSON.parse(saved);
                    // Avoid infinite loop if we are already at the target (though Gen 1 is the default fallback)
                    if (bookShortName && savedChapter && (bookShortName !== 'Gen' || savedChapter !== 1)) {
                        router.replace(`/bible?book=${bookShortName}&chapter=${savedChapter}`);
                    }
                } catch (e) {
                    console.error("Failed to parse lastReadPosition", e);
                }
            }
        }
    }, []);

    // 2. Save last read position to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('lastReadPosition', JSON.stringify({
                bookShortName: book.short_name,
                bookName: book.name,
                chapter: chapter
            }));
        }
    }, [book.short_name, book.name, chapter]);

    const handleWordClick = (word: string) => {
        // Clean the word from punctuation for lookup
        const cleanWord = word.replace(/[.,;!?"'()\[\]]/g, '').trim();
        if (cleanWord.length > 1) {
            setSelectedWord(cleanWord);
        }
    };

    // Calculate Next/Prev Links
    const getNextChapterData = () => {
        if (chapter < book.chapters) {
            return {
                url: `/bible?book=${book.short_name}&chapter=${chapter + 1}`,
                label: `${book.name} ${chapter + 1}`
            };
        }
        // Next book
        const currentIdx = allBooks.findIndex(b => b.short_name === book.short_name);
        if (currentIdx < allBooks.length - 1) {
            const nextBook = allBooks[currentIdx + 1];
            return {
                url: `/bible?book=${nextBook.short_name}&chapter=1`,
                label: `${nextBook.name} 1`
            };
        }
        return null; // End of Bible
    };

    const getPrevChapterData = () => {
        if (chapter > 1) {
            return {
                url: `/bible?book=${book.short_name}&chapter=${chapter - 1}`,
                label: `${book.name} ${chapter - 1}`
            };
        }
        // Prev book
        const currentIdx = allBooks.findIndex(b => b.short_name === book.short_name);
        if (currentIdx > 0) {
            const prevBook = allBooks[currentIdx - 1];
            return {
                url: `/bible?book=${prevBook.short_name}&chapter=${prevBook.chapters}`,
                label: `${prevBook.name} ${prevBook.chapters}`
            };
        }
        return null; // Start of Bible
    };

    const nextData = getNextChapterData();
    const prevData = getPrevChapterData();

    // Find lesson that covers the whole book
    const globalLesson = lessons.find(l => l.chapter_start === 0);

    return (
        <div className="pb-20">
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-4 py-4 border-b border-zinc-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <div
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={() => {
                            setSelectorMode('books');
                            setIsSelectorOpen(true);
                        }}
                    >
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                            <BookOpen size={24} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold flex items-center gap-1 leading-tight">
                                {book.short_name} {chapter} <span className="text-xs text-zinc-400 mt-1">▼</span>
                            </h1>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Bibel lesen</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pr-1 -mr-1">
                        <button
                            onClick={() => setAnalysisConfig({ isOpen: true, type: 'chapter', category: 'KI' })}
                            className={clsx(
                                "p-2.5 rounded-xl transition-all active:scale-90 shrink-0",
                                textStudies.some(s => s.category === 'KI' && s.verse_start === 0)
                                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40"
                                    : "text-zinc-400 bg-zinc-50 dark:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400"
                            )}
                            title="KI-Analyse"
                        >
                            <SparklesIcon size={20} />
                        </button>
                        <button
                            onClick={() => setAnalysisConfig({ isOpen: true, type: 'chapter', category: 'Andere' })}
                            className={clsx(
                                "p-2.5 rounded-xl transition-all active:scale-90 shrink-0",
                                textStudies.some(s => s.category === 'Andere' && s.verse_start === 0)
                                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                                    : "text-zinc-400 bg-zinc-50 dark:bg-slate-800/50 hover:text-emerald-600 dark:hover:text-emerald-400"
                            )}
                            title="Andere Studien"
                        >
                            <Users size={18} />
                        </button>
                        <button
                            onClick={() => setAnalysisConfig({ isOpen: true, type: 'chapter', category: 'Eigene' })}
                            className={clsx(
                                "p-2.5 rounded-xl transition-all active:scale-90 shrink-0",
                                textStudies.some(s => s.category === 'Eigene' && s.verse_start === 0)
                                    ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
                                    : "text-zinc-400 bg-zinc-50 dark:bg-slate-800/50 hover:text-amber-600 dark:hover:text-amber-400"
                            )}
                            title="Eigene Studien"
                        >
                            <User size={18} />
                        </button>


                        <div className="w-px h-6 bg-zinc-200 dark:bg-slate-700 mx-1 shrink-0" />

                        <button
                            onClick={() => setShowLessons(!showLessons)}
                            className={clsx(
                                "p-2.5 rounded-xl transition-all active:scale-90 shrink-0",
                                showLessons
                                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40"
                                    : "text-zinc-400 bg-zinc-50 dark:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400"
                            )}
                            title={showLessons ? "Lektions-Links ausblenden" : "Lektions-Links einblenden"}
                        >
                            <GraduationCap size={20} />
                        </button>

                        <div className="w-px h-6 bg-zinc-200 dark:bg-slate-700 mx-1 shrink-0" />

                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="p-2.5 text-zinc-400 bg-zinc-50 dark:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all active:scale-90 shrink-0"
                            title="Suche öffnen"
                        >
                            <Search size={18} />
                        </button>
                    </div>
                </div>
            </header>

            <BibleReader
                verses={verses}
                wordStudies={lessons.filter(l => l.category === 'Wortstudie')}
                lessons={lessons.filter(l => l.category !== 'Wortstudie')}
                textStudies={textStudies}
                facts={facts}
                questions={questions}
                onWordClick={handleWordClick}
                onVerseClick={(v) => setAnalysisConfig({ isOpen: true, type: 'verse', verse: v })}
                searchQuery={searchQuery}
                showLessons={showLessons}
                chapter={chapter}
            />

            {/* AI Analysis Modal */}
            <AnalysisModal
                isOpen={analysisConfig.isOpen}
                onClose={() => setAnalysisConfig(prev => ({ ...prev, isOpen: false }))}
                type={analysisConfig.type}
                category={analysisConfig.category}
                book={book.name}
                chapter={chapter}
                verse={analysisConfig.verse}
                testament={book.testament}
                existingAnalyses={textStudies.filter(s =>
                    s.category === (analysisConfig.category || 'KI') &&
                    (analysisConfig.type === 'chapter' ? s.verse_start === 0 : s.verse_start === analysisConfig.verse)
                )}
            />

            <div className="flex justify-between px-4 py-8 max-w-prose mx-auto gap-4">
                {prevData ? (
                    <Link
                        href={prevData.url}
                        className="flex-1 px-4 py-3 rounded-lg bg-zinc-100 dark:bg-slate-700 text-sm font-medium text-center hover:bg-zinc-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        &larr; {prevData.label}
                    </Link>
                ) : (
                    <div className="flex-1" />
                )}

                {nextData ? (
                    <Link
                        href={nextData.url}
                        className="flex-1 px-4 py-3 rounded-lg bg-blue-600 text-white text-sm font-bold text-center shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors"
                    >
                        {nextData.label} &rarr;
                    </Link>
                ) : (
                    <div className="flex-1" />
                )}
            </div>

            <ChapterSelector
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                currentBook={book.name}
                currentChapter={chapter}
                books={allBooks}
                initialView={selectorMode}
            />

            {/* Word Meaning Popup */}
            {
                selectedWord && (
                    <WordMeaningPopup
                        word={selectedWord}
                        context={`${book.name} ${chapter}`}
                        testament={book.testament}
                        bookId={book.id}
                        onClose={() => setSelectedWord(null)}
                        onSave={() => {
                            router.refresh();
                        }}
                    />
                )
            }

            <SearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />


        </div >
    );
}
