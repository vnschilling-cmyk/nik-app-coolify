"use client";

import { useState } from "react";
import BibleReader, { VerseData } from "@/components/features/BibleReader";
import ChapterSelector from "@/components/features/ChapterSelector";
import Link from "next/link";
import clsx from "clsx";
import { LinkedLesson } from "@/lib/bible";

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

    const handleWordClick = (word: string) => {
        console.log("Word clicked:", word);
    };

    // Calculate Next/Prev Links
    const getNextLink = () => {
        if (chapter < book.chapters) {
            return `/bible?book=${book.short_name}&chapter=${chapter + 1}`;
        }
        // Next book
        const currentIdx = allBooks.findIndex(b => b.short_name === book.short_name);
        if (currentIdx < allBooks.length - 1) {
            const nextBook = allBooks[currentIdx + 1];
            return `/bible?book=${nextBook.short_name}&chapter=1`;
        }
        return null; // End of Bible
    };

    const getPrevLink = () => {
        if (chapter > 1) {
            return `/bible?book=${book.short_name}&chapter=${chapter - 1}`;
        }
        // Prev book
        const currentIdx = allBooks.findIndex(b => b.short_name === book.short_name);
        if (currentIdx > 0) {
            const prevBook = allBooks[currentIdx - 1];
            return `/bible?book=${prevBook.short_name}&chapter=${prevBook.chapters}`;
        }
        return null; // Start of Bible
    };

    const nextLink = getNextLink();
    const prevLink = getPrevLink();

    return (
        <div className="pb-20">
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 h-14 flex items-center justify-between shadow-sm">
                <h1
                    className="font-semibold text-lg cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => setIsSelectorOpen(true)}
                >
                    {book.name} {chapter} <span className="text-xs text-zinc-400 ml-1">▼</span>
                </h1>

                <button
                    onClick={() => setIsSelectorOpen(true)}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                >
                    Kapitel
                </button>
            </header>

            <BibleReader verses={verses} lessons={lessons} onWordClick={handleWordClick} />

            <div className="flex justify-between px-4 py-8 max-w-prose mx-auto gap-4">
                {prevLink ? (
                    <Link
                        href={prevLink}
                        className="flex-1 px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm font-medium text-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                        &larr; Vorheriges
                    </Link>
                ) : (
                    <div className="flex-1" />
                )}

                {nextLink ? (
                    <Link
                        href={nextLink}
                        className="flex-1 px-4 py-3 rounded-lg bg-blue-600 text-white text-sm font-medium text-center shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors"
                    >
                        Gelesen &rarr;
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
            />
        </div>
    );
}
