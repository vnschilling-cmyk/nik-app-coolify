"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";

// Simplified type for client usage
interface BookSummary {
    name: string;
    short_name: string;
    chapters: number;
    testament: 'OT' | 'NT';
}

interface ChapterSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    currentBook: string;
    currentChapter: number;
    books: BookSummary[];
}

export default function ChapterSelector({ isOpen, onClose, currentBook, currentChapter, books }: ChapterSelectorProps) {
    const router = useRouter();
    const [selectedBook, setSelectedBook] = useState<BookSummary | null>(null);
    const [tab, setTab] = useState<'OT' | 'NT'>('OT');

    // Reset selection when opening
    useEffect(() => {
        if (isOpen) {
            const current = books.find(b => b.name === currentBook) || books[0];
            setSelectedBook(current);
            setTab(current?.testament || 'OT');
        }
    }, [isOpen, currentBook, books]);

    if (!isOpen) return null;

    const handleChapterClick = (chapter: number) => {
        if (!selectedBook) return;
        router.push(`/bible?book=${selectedBook.short_name}&chapter=${chapter}`);
        onClose();
    };

    const displayedBooks = books.filter(b => b.testament === tab);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-zinc-900 w-full max-w-md h-[80vh] sm:h-[600px] sm:rounded-xl rounded-t-xl flex flex-col shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()} // Prevent close on content click
            >
                {/* Header */}
                <div className="flex border-b border-zinc-200 dark:border-zinc-800">
                    <button
                        className={clsx("flex-1 py-3 text-sm font-semibold", tab === 'OT' ? "border-b-2 border-blue-600 text-blue-600" : "text-zinc-500")}
                        onClick={() => setTab('OT')}
                    >
                        Altes Testament
                    </button>
                    <button
                        className={clsx("flex-1 py-3 text-sm font-semibold", tab === 'NT' ? "border-b-2 border-blue-600 text-blue-600" : "text-zinc-500")}
                        onClick={() => setTab('NT')}
                    >
                        Neues Testament
                    </button>
                </div>

                {/* Content Area - Split View */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Books List (Left) */}
                    <div className="w-1/3 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto bg-zinc-50 dark:bg-zinc-950/50">
                        {displayedBooks.map((book) => (
                            <button
                                key={book.short_name}
                                onClick={() => setSelectedBook(book)}
                                className={clsx(
                                    "w-full text-left px-3 py-3 text-sm truncate",
                                    selectedBook?.short_name === book.short_name
                                        ? "bg-white dark:bg-zinc-900 font-semibold border-l-4 border-blue-600 text-zinc-900 dark:text-white"
                                        : "text-zinc-500 hover:bg-black/5"
                                )}
                            >
                                {book.name}
                            </button>
                        ))}
                    </div>

                    {/* Chapters Grid (Right) */}
                    <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-zinc-900">
                        <h3 className="text-center font-bold mb-4 sticky top-0 bg-white dark:bg-zinc-900 py-2">
                            {selectedBook?.name}
                        </h3>
                        {selectedBook && (
                            <div className="grid grid-cols-5 gap-2">
                                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((chapter) => (
                                    <button
                                        key={chapter}
                                        onClick={() => handleChapterClick(chapter)}
                                        className={clsx(
                                            "aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors",
                                            selectedBook.name === currentBook && chapter === currentChapter
                                                ? "bg-blue-600 text-white"
                                                : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                        )}
                                    >
                                        {chapter}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Cancel Button */}
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <button onClick={onClose} className="w-full py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-medium">
                        Abbrechen
                    </button>
                </div>
            </div>
        </div>
    );
}
