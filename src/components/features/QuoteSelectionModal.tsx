"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Quote, Check, RefreshCw } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import clsx from "clsx";

interface QuoteData {
    text: string;
    author: string;
}

interface QuoteSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (quote: QuoteData) => void;
    topic?: string;
    bibleRef?: string;
    lessonContext?: string;
}

export default function QuoteSelectionModal({ isOpen, onClose, onSelect, topic, bibleRef, lessonContext }: QuoteSelectionModalProps) {
    const { canAccessSection } = usePermissions();
    const hasAIPermission = canAccessSection("ai_quotes");
    const [loading, setLoading] = useState(false);
    const [quotes, setQuotes] = useState<QuoteData[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && quotes.length === 0) {
            fetchQuotes();
        }
    }, [isOpen]);

    const fetchQuotes = async () => {
        setLoading(true);
        setError(null);
        if (!hasAIPermission) {
            setError("Du hast keine Berechtigung, KI-Zitate zu generieren.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/generate-quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, bibleRef, lessonContext })
            });

            if (!response.ok) throw new Error('Zitate konnten nicht generiert werden');
            const data = await response.json();
            setQuotes(data);
        } catch (err: any) {
            setError(err.message || 'Ein Fehler ist aufgetreten');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col border border-zinc-200 dark:border-slate-700 animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <header className="px-6 py-4 border-b border-zinc-100 dark:border-slate-700 flex items-center justify-between bg-zinc-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">KI Zitate Vorschläge</h2>
                            <p className="text-xs text-zinc-500">Wähle ein passendes Zitat aus</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchQuotes}
                            disabled={loading}
                            className="p-2 hover:bg-zinc-100 dark:hover:bg-slate-700 rounded-full text-zinc-400 dark:text-zinc-500 transition-colors disabled:opacity-50"
                            title="Neu generieren"
                        >
                            <RefreshCw size={18} className={clsx(loading && "animate-spin")} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-3 hover:bg-zinc-100 dark:hover:bg-slate-700 rounded-full text-zinc-400 dark:text-zinc-500 transition-all active:scale-90"
                            title="Schließen"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                            <Sparkles size={48} className="text-indigo-500 animate-pulse" />
                            <p className="text-zinc-600 dark:text-zinc-400">KI sucht nach verbrieften Zitaten...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <p className="text-red-500 mb-4">{error}</p>
                            <button onClick={fetchQuotes} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold">Erneut versuchen</button>
                        </div>
                    ) : (
                        quotes.map((quote, idx) => (
                            <button
                                key={idx}
                                onClick={() => { onSelect(quote); onClose(); }}
                                className="w-full text-left p-4 rounded-2xl bg-zinc-50 dark:bg-slate-700/40 border border-zinc-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-700 transition-all group relative"
                            >
                                <Quote size={16} className="text-indigo-600 dark:text-indigo-400 mb-2 opacity-50" />
                                <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed mb-3">"{quote.text}"</p>
                                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 text-right">— {quote.author}</p>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Check size={16} className="text-indigo-500" />
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Footer */}
                <footer className="px-6 py-4 border-t border-zinc-100 dark:border-slate-700 bg-zinc-50/30 dark:bg-slate-800/30">
                    <p className="text-[10px] text-zinc-400 text-center italic">
                        Hinweis: KI-generierte Inhalte sollten immer auf Korrektheit geprüft werden.
                    </p>
                </footer>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
            `}</style>
        </div>
    );
}
