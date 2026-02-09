"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, BookOpen, History, Lightbulb, Info, Share2, Download, Check, Users, User } from "lucide-react";
import { pb } from "@/lib/pocketbase";
import { usePermissions } from "@/hooks/usePermissions";
import clsx from "clsx";

import RichTextDisplay from "@/components/ui/RichTextDisplay";

interface ChapterAnalysis {
    title?: string;
    historicalFacts: string[];
    mainThought: string;
    context: string;
}

interface VerseAnalysis {
    verse: string;
    analysis: string;
    insight: string;
}

interface AnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'chapter' | 'verse';
    category?: 'KI' | 'Andere' | 'Eigene';
    book: string;
    chapter: number;
    verse?: number;
    testament: 'OT' | 'NT';
    existingAnalyses?: any[];
}

export default function AnalysisModal({ isOpen, onClose, type, category = 'KI', book, chapter, verse, testament, existingAnalyses }: AnalysisModalProps) {
    const { canAccessSection } = usePermissions();
    const hasAIPermission = canAccessSection("ai_features");
    const [loading, setLoading] = useState(true);
    const [analyses, setAnalyses] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (existingAnalyses && existingAnalyses.length > 0) {
                setAnalyses(existingAnalyses);
                setLoading(false);
            } else if (category === 'KI') {
                if (!hasAIPermission) {
                    setLoading(false);
                    setError("Du hast keine Berechtigung, KI-Funktionen zu nutzen.");
                } else {
                    fetchAnalysis();
                }
            } else {
                setAnalyses([]);
                setLoading(false);
                setError(`Keine Analyse in der Kategorie "${category}" gefunden.`);
            }
        } else {
            // Reset state when closed
            setAnalyses([]);
            setError(null);
            setSaved(false);
        }
    }, [isOpen, book, chapter, verse, category, existingAnalyses]);

    const fetchAnalysis = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/bible-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, book, chapter, verse, testament })
            });

            if (!response.ok) throw new Error('Analyse fehlgeschlagen');
            const data = await response.json();
            setAnalyses([data]);
        } catch (err: any) {
            setError(err.message || 'Ein Fehler ist aufgetreten');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (analyses.length === 0 || saved) return;
        const analysis = analyses[0];

        setLoading(true);
        try {
            // 1. Get book ID
            const bookRecord = await pb.collection('bible_books').getFirstListItem(`name="${book}"`);
            if (!bookRecord) throw new Error("Buch-ID konnte nicht ermittelt werden.");

            // 2. Format content
            let content = "";
            if (type === 'chapter') {
                content = `
                    <div class="space-y-4">
                        <section>
                            <p class="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">Hauptgedanke</p>
                            <p class="italic text-zinc-700 dark:text-zinc-200">„${analysis.mainThought}“</p>
                        </section>
                        <section>
                            <p class="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">Historische Fakten</p>
                            <ul class="list-disc pl-5 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                                ${analysis.historicalFacts.map((f: string) => `<li>${f}</li>`).join('')}
                            </ul>
                        </section>
                        <section>
                            <p class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Kontext</p>
                            <p class="text-sm text-zinc-600 dark:text-zinc-300">${analysis.context}</p>
                        </section>
                    </div>
                `.trim();
            } else {
                content = `
                    <div class="space-y-4">
                        <section>
                            <p class="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">Analyse</p>
                            <p class="text-zinc-700 dark:text-zinc-200">${analysis.analysis}</p>
                        </section>
                        <section>
                            <p class="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">Einblick & Anwendung</p>
                            <p class="italic text-sm text-zinc-600 dark:text-zinc-300 border-l-4 border-amber-200 dark:border-amber-900/40 pl-4">${analysis.insight}</p>
                        </section>
                    </div>
                `.trim();
            }

            // 3. Create record
            await pb.collection('facts').create({
                title: type === 'chapter' ? `${book} ${chapter}` : `${book} ${chapter}:${verse}`,
                description: content,
                category: "KI",
                fact_kind: "text_study",
                book_id: bookRecord.id,
                chapter: chapter,
                verse_start: verse || 0,
                verse_end: verse || 0,
                verse_ref: `${book} ${chapter}${verse ? `:${verse}` : ''}`,
                type: "text",
                author: "KI"
            });

            setSaved(true);
        } catch (err: any) {
            console.error("Save error:", err);
            setError(err.message || "Fehler beim Speichern");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col border border-zinc-200 dark:border-slate-700 animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <header className="px-6 py-4 border-b border-zinc-100 dark:border-slate-700 flex items-center justify-between bg-zinc-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className={clsx(
                            "p-2 rounded-xl",
                            category === 'KI' ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400" :
                                category === 'Andere' ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" :
                                    "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                        )}>
                            {category === 'KI' ? <Sparkles size={20} /> : category === 'Andere' ? <Users size={20} /> : <User size={20} />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-zinc-800 dark:text-white leading-tight">
                                {category === 'KI' ? (type === 'chapter' ? 'Kapitel-Analyse' : 'Vers-Analyse') :
                                    category === 'Andere' ? 'Andere Studie' : 'Eigene Studie'}
                            </h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {book} {chapter}{verse ? `:${verse}` : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-zinc-100 dark:hover:bg-slate-700 rounded-full text-zinc-400 dark:text-zinc-500 transition-colors active:scale-90"
                        title="Schließen"
                    >
                        <X size={20} />
                    </button>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="relative">
                                <Sparkles size={48} className="text-indigo-500 animate-pulse" />
                                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
                            </div>
                            <div className="text-center">
                                <p className="text-zinc-800 dark:text-zinc-200 font-medium">KI analysiert den Text...</p>
                                <p className="text-sm text-zinc-500">Historische Fakten und Einblicke werden abgerufen.</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl mb-4 border border-red-100 dark:border-red-900/30">
                                {error}
                            </div>
                            <button
                                onClick={fetchAnalysis}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                            >
                                Erneut versuchen
                            </button>
                        </div>
                    ) : analyses.length > 0 ? (
                        <div className="space-y-12 pb-4">
                            {analyses.map((analysis, index) => (
                                <div key={analysis.id || index} className={clsx(
                                    "space-y-8",
                                    index > 0 && "pt-8 border-t border-zinc-100 dark:border-slate-700"
                                )}>
                                    {analysis.author && (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-slate-700 rounded-full w-fit">
                                            <User size={14} className="text-zinc-500" />
                                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">{analysis.author}</span>
                                        </div>
                                    )}

                                    {analysis.description ? (
                                        <div className="prose prose-zinc dark:prose-invert max-w-none">
                                            <RichTextDisplay content={analysis.description} />
                                        </div>
                                    ) : type === 'chapter' ? (
                                        <>
                                            {/* Title / Main Thought */}
                                            <section>
                                                <div className="flex items-center gap-2 mb-3 text-indigo-600 dark:text-indigo-400">
                                                    <BookOpen size={18} />
                                                    <h3 className="text-sm font-bold uppercase tracking-wider">Hauptgedanke</h3>
                                                </div>
                                                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-5 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20">
                                                    <p className="text-zinc-700 dark:text-zinc-200 leading-relaxed italic">
                                                        „{analysis.mainThought}“
                                                    </p>
                                                </div>
                                            </section>

                                            {/* Historical Facts */}
                                            <section>
                                                <div className="flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-400">
                                                    <History size={18} />
                                                    <h3 className="text-sm font-bold uppercase tracking-wider">Historische Fakten</h3>
                                                </div>
                                                <ul className="grid gap-3">
                                                    {analysis.historicalFacts.map((fact: string, i: number) => (
                                                        <li key={i} className="flex gap-3 bg-zinc-50 dark:bg-slate-700/40 p-4 rounded-2xl border border-zinc-100 dark:border-slate-700 shadow-sm transition-all hover:bg-zinc-100 dark:hover:bg-slate-700">
                                                            <span className="text-indigo-500 font-bold shrink-0">{i + 1}.</span>
                                                            <span className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{fact}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </section>

                                            {/* Context */}
                                            <section>
                                                <div className="flex items-center gap-2 mb-3 text-emerald-600 dark:text-emerald-400">
                                                    <Info size={18} />
                                                    <h3 className="text-sm font-bold uppercase tracking-wider">Kontext</h3>
                                                </div>
                                                <div className="bg-zinc-50 dark:bg-slate-700/20 p-5 rounded-2xl border border-zinc-100 dark:border-slate-700 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                                    {analysis.context}
                                                </div>
                                            </section>
                                        </>
                                    ) : (
                                        <>
                                            {/* Verse Analysis */}
                                            <section>
                                                <div className="flex items-center gap-2 mb-3 text-indigo-600 dark:text-indigo-400">
                                                    <BookOpen size={18} />
                                                    <h3 className="text-sm font-bold uppercase tracking-wider">Analyse</h3>
                                                </div>
                                                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-5 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20 text-zinc-800 dark:text-zinc-200 leading-relaxed">
                                                    {analysis.analysis}
                                                </div>
                                            </section>

                                            {/* Insight */}
                                            <section>
                                                <div className="flex items-center gap-2 mb-3 text-amber-600 dark:text-amber-400">
                                                    <Lightbulb size={18} />
                                                    <h3 className="text-sm font-bold uppercase tracking-wider">Einblick & Anwendung</h3>
                                                </div>
                                                <div className="bg-amber-50/30 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-100/50 dark:border-amber-900/20 text-zinc-700 dark:text-zinc-300 leading-relaxed italic border-l-4 border-l-amber-400">
                                                    {analysis.insight}
                                                </div>
                                            </section>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>

                {/* Footer Buttons */}
                <footer className="px-6 py-4 border-t border-zinc-100 dark:border-slate-700 flex items-center gap-3 bg-zinc-50/30 dark:bg-slate-800/30">
                    {(!existingAnalyses || existingAnalyses.length === 0) && (
                        <button
                            onClick={handleSave}
                            className={clsx(
                                "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50",
                                saved
                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                    : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700"
                            )}
                            disabled={loading || saved}
                        >
                            {saved ? (
                                <>
                                    <Check size={16} />
                                    Gespeichert
                                </>
                            ) : (
                                <>
                                    <Download size={16} />
                                    Speichern
                                </>
                            )}
                        </button>
                    )}
                    <button
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-slate-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                        disabled={loading}
                    >
                        <Share2 size={16} />
                        Teilen
                    </button>
                </footer>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155;
                }
            `}</style>
        </div>
    );
}
