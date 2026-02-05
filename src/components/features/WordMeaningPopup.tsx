"use client";

import { useState, useEffect } from "react";
import { X, BookOpen, Languages, Hash, Quote, Sparkles, StickyNote, Save } from "lucide-react";
import { pb } from "@/lib/pocketbase";
import RichTextDisplay from "@/components/ui/RichTextDisplay";
import clsx from "clsx";

interface WordMeaningData {
    originalWord: string;
    transliteration: string;
    strongNumber: string;
    meaning: string;
    synonyms: string[];
    usage: string;
    rootMeaning: string;
    manualStudy?: {
        title: string;
        description: string;
    };
}

interface WordMeaningPopupProps {
    word: string;
    context: string;
    testament: 'OT' | 'NT';
    bookId?: string;
    onClose: () => void;
}

export default function WordMeaningPopup({ word, context, testament, bookId, onClose }: WordMeaningPopupProps) {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<WordMeaningData | null>(null);

    // Fetch word meaning on mount
    useEffect(() => {
        fetchMeaning();
    }, [word]);

    const handleSave = async () => {
        if (!data || isSaving || saved) return;
        setIsSaving(true);
        try {
            // Format AI response as Rich Text/HTML (consistent with InfosTab.tsx)
            const formattedDescription = `
                <div class="space-y-4">
                    <div class="bg-zinc-50 dark:bg-slate-700/40 rounded-xl p-4 border border-zinc-100 dark:border-slate-600">
                        <p class="text-2xl font-serif mb-1">${data.originalWord || '—'}</p>
                        ${data.transliteration ? `<p class="text-sm text-zinc-500 italic">${data.transliteration}</p>` : ''}
                        ${data.strongNumber ? `<p class="text-xs text-indigo-500 mt-2 font-mono">Strong: ${data.strongNumber}</p>` : ''}
                    </div>
                    
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">Bedeutung</p>
                        <p>${data.meaning || '—'}</p>
                    </div>

                    ${data.rootMeaning ? `
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-purple-600 mb-2">Wortwurzel</p>
                        <p class="text-sm">${data.rootMeaning}</p>
                    </div>` : ''}

                    ${data.synonyms?.length ? `
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">Synonyme</p>
                        <div class="flex flex-wrap gap-2">
                            ${data.synonyms.map((s: string) => `<span class="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs">${s}</span>`).join('')}
                        </div>
                    </div>` : ''}

                    ${data.usage ? `
                    <div class="pt-2 border-t border-zinc-100 dark:border-slate-700">
                        <p class="text-sm text-zinc-100"><span class="font-bold text-amber-400">Verwendung:</span> ${data.usage}</p>
                    </div>` : ''}
                </div>
            `.trim();

            await pb.collection('facts').create({
                title: `Wortstudie: ${word}`,
                description: formattedDescription,
                category: "Wortstudie",
                fact_kind: "word_study",
                word: word,
                type: "text",
                // No bible reference by default when saving from analysis popup
                has_bible_ref: !!bookId,
                book_id: bookId || "",
                chapter: 0,
                verse_start: 0,
                verse_end: 0
            });
            setSaved(true);
        } catch (e: any) {
            console.error("Failed to save word study:", e);
            alert("Fehler beim Speichern: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const fetchMeaning = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Check for manual study first (exact match or similar)
            const cleanWord = word.trim().toLowerCase();
            const manualRes = await pb.collection('facts').getFirstListItem(
                `fact_kind = "word_study" && word ~ "${cleanWord}"`,
                { $autoCancel: false }
            ).catch(() => null);

            if (manualRes) {
                setData({
                    originalWord: word,
                    transliteration: "",
                    strongNumber: "",
                    meaning: "", // Empty to avoid redundancy with manualStudy.description
                    rootMeaning: "",
                    usage: "",
                    synonyms: [],
                    manualStudy: {
                        title: manualRes.title,
                        description: manualRes.description
                    }
                });
                setSaved(true);
                setLoading(false);
                return;
            }

            // 2. Fetch AI meaning if no manual study found
            const aiRes = await fetch('/api/word-meaning', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word, context, testament })
            });

            if (!aiRes.ok) {
                throw new Error('Fehler beim Laden der AI Analyse');
            }

            const result = await aiRes.json();
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
                            {/* Manual Study (Pinned top) */}
                            {data.manualStudy && (
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-4 mb-4">
                                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
                                        <StickyNote size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Eigene Wortstudie</span>
                                    </div>
                                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-2">{data.manualStudy.title}</h3>
                                    <div className="text-zinc-700 dark:text-zinc-300 prose prose-sm dark:prose-invert max-w-none">
                                        <RichTextDisplay content={data.manualStudy.description} />
                                    </div>
                                </div>
                            )}

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
                            {data.meaning && data.meaning !== '—' && (
                                <div>
                                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                                        <BookOpen size={16} />
                                        <span className="text-xs font-bold uppercase">Bedeutung</span>
                                    </div>
                                    <p className="text-zinc-700 dark:text-zinc-300">{data.meaning}</p>
                                </div>
                            )}

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
                                    <p className="text-sm text-zinc-700 dark:text-zinc-100">
                                        <span className="font-semibold text-amber-600 dark:text-amber-400">Verwendung:</span> {data.usage}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-zinc-100 dark:border-slate-700 bg-zinc-50 dark:bg-slate-700/40 flex gap-3">
                    {data && !loading && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving || saved}
                            className={clsx(
                                "flex-1 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2",
                                saved
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 cursor-default"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                            )}
                        >
                            {isSaving ? (
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            ) : saved ? (
                                <>✓ Gespeichert</>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Speichern
                                </>
                            )}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className={clsx(
                            "py-2.5 px-4 bg-zinc-200 dark:bg-slate-700 rounded-lg font-medium text-zinc-700 dark:text-slate-300 hover:bg-zinc-300 dark:hover:bg-slate-600 transition-colors",
                            data && !loading ? "w-auto" : "w-full"
                        )}
                    >
                        {data && !loading ? "Abbrechen" : "Schließen"}
                    </button>
                </div>
            </div>
        </div>
    );
}
