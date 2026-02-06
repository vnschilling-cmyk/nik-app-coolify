"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X, Filter, ChevronRight, BookOpen } from "lucide-react";
import { getBooks, BibleBook, SearchResult } from "@/lib/bible";
import { searchBibleAction } from "@/app/actions";
import { useDesign } from "@/context/DesignContext";
import Link from "next/link";

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const { currentFontVariableDetails } = useDesign();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [books, setBooks] = useState<BibleBook[]>([]);

    // Filters
    const [filterMode, setFilterMode] = useState<'ALL' | 'OT' | 'NT' | 'BOOK'>('ALL');
    const [selectedBookId, setSelectedBookId] = useState<string>("");

    // State for collapsible sections (Accordion)
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const toggleGroup = (bookName: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [bookName]: !prev[bookName]
        }));
    };

    useEffect(() => {
        if (isOpen) {
            getBooks().then(setBooks).catch(() => setError("Konnte Bücherliste nicht laden"));
        }
    }, [isOpen]);

    const handleSearch = useCallback(async (e?: React.FormEvent, limitOverride?: number) => {
        e?.preventDefault();
        // If calling with load more (limitOverride), don't reset everything!
        const isLoadMore = !!limitOverride;

        if (query.length < 3) return;

        setLoading(true);
        setError(null);
        if (!isLoadMore) {
            setResults([]);
            setCount(0);
        }

        try {
            const filter = {
                testament: (filterMode === 'OT' || filterMode === 'NT') ? filterMode : undefined,
                bookId: filterMode === 'BOOK' ? selectedBookId : undefined
            };

            const res = await searchBibleAction(query, filter, limitOverride || 50);

            if (res.success) {
                setResults(res.data);
                setCount(res.count);
            } else {
                throw new Error(res.error);
            }

        } catch (error: any) {
            console.error(error);
            setError("Fehler bei der Suche: " + (error.message || "Unbekannter Fehler"));
        } finally {
            setLoading(false);
        }
    }, [query, filterMode, selectedBookId]);

    // Auto-refresh when filters change
    useEffect(() => {
        if (query.length >= 3) {
            handleSearch();
        }
    }, [filterMode, selectedBookId]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-800/60 backdrop-blur-sm animate-fadeIn">
            <div
                className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[85vh] border border-zinc-200 dark:border-slate-700"
                style={{ fontFamily: currentFontVariableDetails }}
            >
                {/* Header */}
                <div className="p-4 border-b border-zinc-100 dark:border-slate-700 flex items-center gap-3">
                    <Search className="text-zinc-400" size={20} />
                    <form onSubmit={handleSearch} className="flex-1">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Suchen..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-transparent border-none outline-none text-lg text-zinc-900 dark:text-white placeholder-zinc-400"
                        />
                    </form>
                    <button onClick={onClose} className="p-2 bg-zinc-100 dark:bg-slate-700 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-slate-100 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Filters */}
                <div className="px-4 py-3 bg-zinc-50 dark:bg-slate-800/40 border-b border-zinc-100 dark:border-slate-700 flex flex-wrap gap-2 items-center">
                    <button
                        onClick={() => setFilterMode('ALL')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${filterMode === 'ALL'
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                            : "bg-white dark:bg-slate-700 text-zinc-500 border border-zinc-200 dark:border-slate-600 hover:border-zinc-300"
                            }`}
                    >
                        Alle
                    </button>
                    <button
                        onClick={() => setFilterMode('OT')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${filterMode === 'OT'
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                            : "bg-white dark:bg-slate-700 text-zinc-500 border border-zinc-200 dark:border-slate-600 hover:border-zinc-300"
                            }`}
                    >
                        AT
                    </button>
                    <button
                        onClick={() => setFilterMode('NT')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${filterMode === 'NT'
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                            : "bg-white dark:bg-slate-700 text-zinc-500 border border-zinc-200 dark:border-slate-600 hover:border-zinc-300"
                            }`}
                    >
                        NT
                    </button>

                    <div className="relative flex items-center flex-grow sm:flex-grow-0 min-w-[120px]">
                        <select
                            value={filterMode === 'BOOK' ? selectedBookId : ""}
                            onChange={(e) => {
                                setFilterMode('BOOK');
                                setSelectedBookId(e.target.value);
                            }}
                            className={`w-full appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border bg-transparent cursor-pointer transition-colors ${filterMode === 'BOOK'
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800"
                                : "bg-white dark:bg-slate-700 text-zinc-500 border-zinc-200 dark:border-slate-600 hover:border-zinc-300"
                                }`}
                        >
                            <option value="" disabled>Buch...</option>
                            {books.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                        <Filter size={12} className="absolute right-2.5 pointer-events-none opacity-50" />
                    </div>
                </div>

                {/* Results Header */}
                {!loading && !error && results.length > 0 && (
                    <div className="px-4 py-2 text-xs font-medium text-zinc-500 border-b border-zinc-100 dark:border-slate-700 flex justify-between items-center">
                        <span>{count} Treffer gefunden</span>
                        {count > 50 && <span className="text-amber-600 dark:text-amber-500">Zeige erste 50</span>}
                    </div>
                )}

                {/* Results - Grouped by Book */}
                <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4 min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 space-y-3 text-zinc-400">
                            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Suche läuft...</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-40 text-red-500 text-center space-y-2">
                            <p className="font-bold">Hoppla!</p>
                            <p className="text-sm">{error}</p>
                            <button onClick={() => handleSearch()} className="px-4 py-2 bg-zinc-100 dark:bg-slate-700 text-zinc-900 dark:text-white rounded-lg text-xs font-bold mt-2 hover:bg-zinc-200 dark:hover:bg-slate-600">
                                Erneut versuchen
                            </button>
                        </div>
                    ) : results.length > 0 ? (
                        <>
                            {Object.entries(
                                results.reduce((acc, verse) => {
                                    const key = verse.bookName;
                                    if (!acc[key]) acc[key] = [];
                                    acc[key].push(verse);
                                    return acc;
                                }, {} as Record<string, SearchResult[]>)
                            ).map(([bookName, verses]) => {
                                const isExpanded = expandedGroups[bookName];

                                return (
                                    <div key={bookName} className="space-y-2">
                                        <div
                                            className="sticky top-0 z-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm py-2 border-b border-zinc-100 dark:border-slate-700 cursor-pointer hover:bg-zinc-50 dark:hover:bg-slate-700/50 transition-colors select-none group/header"
                                            onClick={() => toggleGroup(bookName)}
                                        >
                                            <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-400 uppercase tracking-wider flex items-center justify-between px-1">
                                                <div className="flex items-center gap-2">
                                                    <ChevronRight
                                                        size={14}
                                                        className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                                                    />
                                                    <span>{bookName}</span>
                                                </div>
                                                <span className="bg-zinc-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-[10px] group-hover/header:bg-zinc-200 dark:group-hover/header:bg-slate-600 transition-colors">
                                                    {verses.length}
                                                </span>
                                            </h3>
                                        </div>

                                        {isExpanded && (
                                            <div className="space-y-2 animate-fadeIn">
                                                {verses.map(r => (
                                                    <Link
                                                        key={r.id}
                                                        href={`/bible?book=${r.bookShort}&chapter=${r.chapter}&q=${query}#v${r.verse}`}
                                                        onClick={onClose}
                                                        className="block p-3 rounded-xl bg-zinc-50 dark:bg-slate-700/40 hover:bg-zinc-100 dark:hover:bg-slate-700 transition-colors border border-transparent hover:border-indigo-200 dark:hover:border-indigo-600 group"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded">
                                                                        {r.bookShort} {r.chapter}:{r.verse}
                                                                    </span>
                                                                    <span className="text-[10px] text-zinc-400 capitalize">{r.translation}</span>
                                                                </div>
                                                                <p
                                                                    className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2"
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: r.text.replace(
                                                                            new RegExp(`(${query})`, 'gi'),
                                                                            '<span class="bg-amber-200 dark:bg-amber-900/50 text-amber-900 dark:text-amber-100 px-0.5 rounded">$1</span>'
                                                                        )
                                                                    }}
                                                                />
                                                            </div>
                                                            <ChevronRight size={16} className="text-zinc-300 group-hover:text-indigo-500 transition-colors mt-1" />
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Load More Button - Loads ALL remaining if click */}
                            {results.length < count && (
                                <div className="pt-4 pb-8 flex justify-center">
                                    <button
                                        onClick={() => handleSearch(undefined, count)}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all flex items-center gap-2"
                                    >
                                        <span>Alle Ergebnisse laden ({count - results.length} verbleibend)</span>
                                        <ChevronRight size={16} className="rotate-90" />
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-zinc-400 space-y-2">
                            <BookOpen size={32} className="opacity-20" />
                            <p>Keine Ergebnisse gefunden.</p>
                        </div>
                    )}
                </div>

                {!query && results.length === 0 && !loading && !error && (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-400 text-center space-y-2 opacity-50 mt-10">
                        <Search size={48} className="opacity-20" />
                        <p className="text-sm">Gib einen Suchbegriff ein um die Bibel zu durchsuchen.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
