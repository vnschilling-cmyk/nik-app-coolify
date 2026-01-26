"use client";

import { useState, useEffect, useMemo } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { Search, X, ChevronRight, Book } from "lucide-react";

interface BookSummary {
    name: string;
    short_name: string;
    chapters: number;
    testament: 'OT' | 'NT';
    order: number;
}

interface ChapterSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    currentBook: string;
    currentChapter: number;
    books: BookSummary[];
}

// Book genre colors based on order
const getBookColor = (shortName: string, order: number, testament: 'OT' | 'NT') => {
    // Old Testament categories
    if (testament === 'OT') {
        // Pentateuch (1-5)
        if (order >= 1 && order <= 5) {
            return { bg: "bg-blue-500", text: "text-white", label: "Pentateuch" };
        }
        // Historical Books (6-17)
        if (order >= 6 && order <= 17) {
            return { bg: "bg-amber-500", text: "text-white", label: "Geschichte" };
        }
        // Wisdom/Poetry (18-22)
        if (order >= 18 && order <= 22) {
            return { bg: "bg-purple-500", text: "text-white", label: "Weisheit" };
        }
        // Major Prophets (23-27)
        if (order >= 23 && order <= 27) {
            return { bg: "bg-red-500", text: "text-white", label: "Große Propheten" };
        }
        // Minor Prophets (28-39)
        return { bg: "bg-orange-500", text: "text-white", label: "Kleine Propheten" };
    }

    // New Testament categories
    // Gospels (40-43)
    if (order >= 40 && order <= 43) {
        return { bg: "bg-emerald-500", text: "text-white", label: "Evangelien" };
    }
    // Acts (44)
    if (order === 44) {
        return { bg: "bg-teal-500", text: "text-white", label: "Geschichte" };
    }
    // Pauline Epistles (45-57)
    if (order >= 45 && order <= 57) {
        return { bg: "bg-indigo-500", text: "text-white", label: "Paulusbriefe" };
    }
    // General Epistles (58-65)
    if (order >= 58 && order <= 65) {
        return { bg: "bg-cyan-500", text: "text-white", label: "Allg. Briefe" };
    }
    // Revelation (66)
    return { bg: "bg-rose-500", text: "text-white", label: "Prophetie" };
};

export default function ChapterSelector({ isOpen, onClose, currentBook, currentChapter, books }: ChapterSelectorProps) {
    const router = useRouter();
    const [selectedBook, setSelectedBook] = useState<BookSummary | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [view, setView] = useState<'books' | 'chapters'>('books');

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setSearchQuery("");
            setView('books');
            const current = books.find(b => b.name === currentBook);
            if (current) {
                setSelectedBook(current);
            }
        }
    }, [isOpen, currentBook, books]);

    const filteredBooks = useMemo(() => {
        if (!searchQuery.trim()) return books;
        const q = searchQuery.toLowerCase();
        return books.filter(b =>
            b.name.toLowerCase().includes(q) ||
            b.short_name.toLowerCase().includes(q)
        );
    }, [books, searchQuery]);

    const otBooks = filteredBooks.filter(b => b.testament === 'OT');
    const ntBooks = filteredBooks.filter(b => b.testament === 'NT');

    if (!isOpen) return null;

    const handleBookSelect = (book: BookSummary) => {
        setSelectedBook(book);
        setView('chapters');
    };

    const handleChapterClick = (chapter: number) => {
        if (!selectedBook) return;
        router.push(`/bible?book=${selectedBook.short_name}&chapter=${chapter}`);
        onClose();
    };

    const handleBack = () => {
        setView('books');
    };

    // Get abbreviated name (use short_name or first 3-4 chars)
    const getDisplayName = (book: BookSummary) => {
        return book.short_name;
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-white dark:bg-zinc-950 flex flex-col animate-in fade-in duration-200"
        >
            {/* Header */}
            <header className="shrink-0 px-4 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                {view === 'chapters' ? (
                    <button
                        onClick={handleBack}
                        className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                ) : (
                    <div className="p-2 -ml-2">
                        <Book className="w-5 h-5 text-indigo-500" />
                    </div>
                )}
                <h2 className="text-lg font-bold flex-1">
                    {view === 'chapters' ? selectedBook?.name : "Bibelstelle wählen"}
                </h2>
                <button
                    onClick={onClose}
                    className="p-2 -mr-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </header>

            {/* Books View */}
            {view === 'books' && (
                <>
                    {/* Search */}
                    <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Buch suchen..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Books List */}
                    <div className="flex-1 overflow-y-auto">
                        {/* OT Section */}
                        {otBooks.length > 0 && (
                            <div className="mb-4">
                                <div className="sticky top-0 bg-white dark:bg-zinc-950 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800/50 z-10">
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Altes Testament</h3>
                                </div>
                                <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5 p-2">
                                    {otBooks.map(book => {
                                        const color = getBookColor(book.short_name, book.order, book.testament);
                                        const isActive = book.name === currentBook;
                                        return (
                                            <button
                                                key={book.short_name}
                                                onClick={() => handleBookSelect(book)}
                                                className={clsx(
                                                    "aspect-square rounded-lg flex flex-col items-center justify-center p-0.5 transition-all active:scale-95 relative overflow-hidden",
                                                    isActive
                                                        ? `${color.bg} ${color.text} ring-2 ring-offset-2 ring-indigo-500`
                                                        : `${color.bg} ${color.text} opacity-80 hover:opacity-100`
                                                )}
                                                title={book.name}
                                            >
                                                <span className="font-bold text-xs leading-tight text-center">{getDisplayName(book)}</span>
                                                <span className="text-[8px] opacity-75">{book.chapters}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* NT Section */}
                        {ntBooks.length > 0 && (
                            <div className="mb-4">
                                <div className="sticky top-0 bg-white dark:bg-zinc-950 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800/50 z-10">
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Neues Testament</h3>
                                </div>
                                <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5 p-2">
                                    {ntBooks.map(book => {
                                        const color = getBookColor(book.short_name, book.order, book.testament);
                                        const isActive = book.name === currentBook;
                                        return (
                                            <button
                                                key={book.short_name}
                                                onClick={() => handleBookSelect(book)}
                                                className={clsx(
                                                    "aspect-square rounded-lg flex flex-col items-center justify-center p-0.5 transition-all active:scale-95 relative overflow-hidden",
                                                    isActive
                                                        ? `${color.bg} ${color.text} ring-2 ring-offset-2 ring-indigo-500`
                                                        : `${color.bg} ${color.text} opacity-80 hover:opacity-100`
                                                )}
                                                title={book.name}
                                            >
                                                <span className="font-bold text-xs leading-tight text-center">{getDisplayName(book)}</span>
                                                <span className="text-[8px] opacity-75">{book.chapters}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {filteredBooks.length === 0 && (
                            <div className="text-center py-12 text-zinc-400">
                                <p>Kein Buch gefunden.</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Chapters View */}
            {view === 'chapters' && selectedBook && (
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-5 sm:grid-cols-6 gap-3">
                        {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(chapter => (
                            <button
                                key={chapter}
                                onClick={() => handleChapterClick(chapter)}
                                className={clsx(
                                    "aspect-square rounded-2xl flex items-center justify-center text-lg font-semibold transition-all active:scale-95",
                                    selectedBook.name === currentBook && chapter === currentChapter
                                        ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                                        : "bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                                )}
                            >
                                {chapter}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
