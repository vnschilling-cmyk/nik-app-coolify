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
import { Sparkles as SparklesIcon, Users, User } from "lucide-react";

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
    const searchQuery = searchParams.get('q') || undefined;

    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [selectorMode, setSelectorMode] = useState<'books' | 'chapters'>('books');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [selectedWord, setSelectedWord] = useState<string | null>(null);
    const [selectedFact, setSelectedFact] = useState<ChapterFact | null>(null);
    const [selectedQuestion, setSelectedQuestion] = useState<ChapterQuestion | null>(null);
    const [analysisConfig, setAnalysisConfig] = useState<{
        isOpen: boolean;
        type: 'chapter' | 'verse';
        category?: 'KI' | 'Andere' | 'Eigene';
        verse?: number
    }>({ isOpen: false, type: 'chapter' });
    const [showLessons, setShowLessons] = useState(true);

    // Separate facts and questions into chapter-specific (bubbles) vs global (textboxes)
    const chapterFacts = facts.filter(f => !f.isGlobal);
    const chapterQuestions = questions.filter(q => !q.isGlobal);
    const globalFacts = facts.filter(f => f.isGlobal);
    const globalQuestions = questions.filter(q => q.isGlobal);

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
                                {book.name} {chapter} <span className="text-xs text-zinc-400 mt-1">▼</span>
                            </h1>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Bibel lesen</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onClick={() => setAnalysisConfig({ isOpen: true, type: 'chapter', category: 'KI' })}
                            className={clsx(
                                "p-2 rounded-xl transition-all active:scale-95",
                                textStudies.some(s => s.category === 'KI' && s.verse_start === 0)
                                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                                    : "text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-slate-800"
                            )}
                            title="KI-Analyse"
                        >
                            <SparklesIcon size={18} />
                        </button>
                        <button
                            onClick={() => setAnalysisConfig({ isOpen: true, type: 'chapter', category: 'Andere' })}
                            className={clsx(
                                "p-2 rounded-xl transition-all active:scale-95",
                                textStudies.some(s => s.category === 'Andere' && s.verse_start === 0)
                                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                                    : "text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-slate-800"
                            )}
                            title="Andere Studien"
                        >
                            <Users size={18} />
                        </button>
                        <button
                            onClick={() => setAnalysisConfig({ isOpen: true, type: 'chapter', category: 'Eigene' })}
                            className={clsx(
                                "p-2 rounded-xl transition-all active:scale-95",
                                textStudies.some(s => s.category === 'Eigene' && s.verse_start === 0)
                                    ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
                                    : "text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-slate-800"
                            )}
                            title="Eigene Studien"
                        >
                            <User size={18} />
                        </button>

                        <button
                            onClick={() => setShowLessons(!showLessons)}
                            className={clsx(
                                "p-2 rounded-xl transition-all active:scale-95",
                                showLessons
                                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                                    : "text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-slate-800"
                            )}
                            title={showLessons ? "Lektionen ausblenden" : "Lektionen einblenden"}
                        >
                            <GraduationCap size={18} />
                        </button>

                        <div className="w-px h-6 bg-zinc-200 dark:bg-slate-700 mx-1" />

                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="p-2 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            title="Suche öffnen"
                        >
                            <Search size={18} />
                        </button>
                    </div>
                </div>
            </header>

            <BibleReader
                verses={verses}
                lessons={showLessons ? lessons : []}
                wordStudies={lessons.filter(l => l.category === 'Wortstudie')}
                onWordClick={handleWordClick}
                onVerseClick={(v) => setAnalysisConfig({ isOpen: true, type: 'verse', verse: v })}
                searchQuery={searchQuery}
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
                    />
                )
            }

            <SearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />

            {/* Global Content Section (for whole-book lessons) */}
            {(globalFacts.length > 0 || globalQuestions.length > 0) && (
                <section className="px-4 pb-8 max-w-prose mx-auto">
                    <h2 className="text-lg font-bold mb-4 text-zinc-800 dark:text-zinc-200">Zum Buch {book.name}</h2>
                    <div className="space-y-3">
                        {[...globalFacts.map(f => ({ ...f, _type: 'fact' as const })), ...globalQuestions.map(q => ({ ...q, _type: 'question' as const }))]
                            .sort((a, b) => a.order - b.order)
                            .map(item => (
                                item._type === 'fact' ? (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedFact(item as ChapterFact)}
                                        className="w-full text-left p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg shrink-0">
                                                <Lightbulb size={16} className="text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm text-amber-900 dark:text-amber-100">{(item as ChapterFact).title || 'Info'}</p>
                                                <p className="text-xs text-amber-700 dark:text-amber-300 line-clamp-2 mt-1">{(item as ChapterFact).content}</p>
                                            </div>
                                        </div>
                                    </button>
                                ) : (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedQuestion(item as ChapterQuestion)}
                                        className="w-full text-left p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg shrink-0">
                                                <HelpCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm text-emerald-900 dark:text-emerald-100">{(item as ChapterQuestion).question}</p>
                                            </div>
                                        </div>
                                    </button>
                                )
                            ))}
                    </div>
                </section>
            )}

            {/* Fact Detail Modal */}
            {selectedFact && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedFact(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-zinc-200 dark:border-slate-700 relative animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedFact(null)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                            title="Schließen"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center">
                                <Lightbulb size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{selectedFact.title || 'Info'}</h3>
                                {selectedFact.category && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                                        {selectedFact.category}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{selectedFact.content}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Question Detail Modal */}
            {selectedQuestion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedQuestion(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-zinc-200 dark:border-slate-700 relative animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedQuestion(null)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                            title="Schließen"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center">
                                <HelpCircle size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Frage</h3>
                                {selectedQuestion.category && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                                        {selectedQuestion.category}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-zinc-900 dark:text-zinc-100 font-medium">{selectedQuestion.question}</p>
                            {selectedQuestion.answer && (
                                <div className="pt-3 border-t border-zinc-200 dark:border-slate-700">
                                    <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1">Antwort</p>
                                    <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{selectedQuestion.answer}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
