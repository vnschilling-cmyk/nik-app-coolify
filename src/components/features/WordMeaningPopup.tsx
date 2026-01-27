"use client";

import { useState, useEffect } from "react";
import { X, BookOpen, Languages, Hash, Quote, Sparkles } from "lucide-react";

interface WordMeaningData {
    originalWord: string;
    transliteration: string;
    strongNumber: string;
    meaning: string;
    synonyms: string[];
    usage: string;
    rootMeaning: string;
}

interface WordMeaningPopupProps {
    word: string;
    context: string;
    testament: 'OT' | 'NT';
    onClose: () => void;
}

export default function WordMeaningPopup({ word, context, testament, onClose }: WordMeaningPopupProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<WordMeaningData | null>(null);

    // Fetch word meaning on mount
    useEffect(() => {
        fetchMeaning();
    }, [word]);

    const fetchMeaning = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/word-meaning', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word, context, testament })
            });

            if (!response.ok) {
                throw new Error('Fehler beim Laden');
            }

            const result = await response.json();
            setData(result);
        } catch (e: any) {
            setError(e.message || 'Fehler beim Laden der Wortbedeutung');
        } finally {
            setLoading(false);
        }
    };

    const languageLabel = testament === 'NT' ? 'Griechisch' : 'Hebräisch';
    const gradientClass = testament === 'NT'
        ? 'from-blue-500 to-indigo-600'
        : 'from-amber-500 to-orange-600';

    return (
        <div className="fixed inset-0 bg-slate-800/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[85vh] flex flex-col border border-transparent dark:border-slate-700"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`bg-gradient-to-r ${gradientClass} px-5 py-4 text-white`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs opacity-75 mb-1 flex items-center gap-1">
                                <Sparkles size={12} /> AI Wortanalyse
                            </p>
                            <h2 className="text-2xl font-bold">„{word}"</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full mb-3" />
                            <p className="text-sm text-zinc-400">Analysiere Wortbedeutung...</p>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-8">
                            <p className="text-red-500 mb-3">{error}</p>
                            <button
                                onClick={fetchMeaning}
                                className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm"
                            >
                                Erneut versuchen
                            </button>
                        </div>
                    )}

                    {data && !loading && (
                        <>
                            {/* Original Word */}
                            <div className="bg-zinc-50 dark:bg-slate-700/40 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
                                    <Languages size={16} />
                                    <span className="text-xs font-bold uppercase">{languageLabel}</span>
                                </div>
                                <p className="text-2xl font-serif mb-1">{data.originalWord || '—'}</p>
                                {data.transliteration && (
                                    <p className="text-sm text-zinc-500 italic">{data.transliteration}</p>
                                )}
                                {data.strongNumber && (
                                    <div className="flex items-center gap-1 mt-2 text-xs text-zinc-400">
                                        <Hash size={12} />
                                        <span>{data.strongNumber}</span>
                                    </div>
                                )}
                            </div>

                            {/* Meaning */}
                            <div>
                                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                                    <BookOpen size={16} />
                                    <span className="text-xs font-bold uppercase">Bedeutung</span>
                                </div>
                                <p className="text-zinc-700 dark:text-zinc-300">{data.meaning || '—'}</p>
                            </div>

                            {/* Root Meaning */}
                            {data.rootMeaning && (
                                <div>
                                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                                        <span className="text-xs font-bold uppercase">Wortwurzel</span>
                                    </div>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{data.rootMeaning}</p>
                                </div>
                            )}

                            {/* Synonyms */}
                            {data.synonyms && data.synonyms.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                                        <Quote size={16} />
                                        <span className="text-xs font-bold uppercase">Synonyme</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {data.synonyms.map((syn, i) => (
                                            <span
                                                key={i}
                                                className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm"
                                            >
                                                {syn}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Usage */}
                            {data.usage && (
                                <div className="border-t border-zinc-100 dark:border-slate-700 pt-4">
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        <span className="font-semibold">Verwendung:</span> {data.usage}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-zinc-100 dark:border-slate-700 bg-zinc-50 dark:bg-slate-700/40">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-zinc-200 dark:bg-slate-700 rounded-lg font-medium text-zinc-700 dark:text-slate-300 hover:bg-zinc-300 dark:hover:bg-slate-600 transition-colors"
                    >
                        Schließen
                    </button>
                </div>
            </div>
        </div>
    );
}
