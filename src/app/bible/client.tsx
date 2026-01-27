"use client";

import { useState, useEffect } from "react";
import BibleReader, { VerseData } from "@/components/features/BibleReader";
import ChapterSelector from "@/components/features/ChapterSelector";
import WordMeaningPopup from "@/components/features/WordMeaningPopup";
import Link from "next/link";
import clsx from "clsx";
import { LinkedLesson } from "@/lib/bible";
import { Search } from "lucide-react";
import SearchModal from "@/components/features/SearchModal";

interface BookSummary {
    name: string;
    short_name: string;
    chapters: number;
    testament: 'OT' | 'NT';
    order: number;
}

interface BiblePageClientProps {
    verses: VerseData[];
    lessons: LinkedLesson[];
    book: BookSummary;
    chapter: number;
    allBooks: BookSummary[];
}

export default function BiblePageClient({ verses, lessons, book, chapter, allBooks }: BiblePageClientProps) {
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [selectorMode, setSelectorMode] = useState<'books' | 'chapters'>('books');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [selectedWord, setSelectedWord] = useState<string | null>(null);

    // Save last read position to localStorage
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
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-zinc-200 dark:border-slate-700 px-4 h-14 flex items-center justify-between shadow-sm">
                <h1
                    className="font-semibold text-lg cursor-pointer hover:text-blue-600 transition-colors flex items-center gap-1"
                    onClick={() => {
                        setSelectorMode('books');
                        setIsSelectorOpen(true);
                    }}
                >
                    {book.name} {chapter} <span className="text-xs text-zinc-400 mt-1">▼</span>
                </h1>

                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="p-2 text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors"
                    >
                        <Search size={20} />
                    </button>
                    <button
                        onClick={() => {
                            setSelectorMode('chapters');
                            setIsSelectorOpen(true);
                        }}
                        className="text-sm font-medium text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                    >
                        Kapitel
                    </button>
                </div>
            </header>

            <BibleReader verses={verses} lessons={lessons} onWordClick={handleWordClick} />

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
            {selectedWord && (
                <WordMeaningPopup
                    word={selectedWord}
                    context={`${book.name} ${chapter}`}
                    testament={book.testament}
                    onClose={() => setSelectedWord(null)}
                />
            )}

            <SearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />
        </div>
    );
}
