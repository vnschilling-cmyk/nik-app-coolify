"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { MessageCircle, CheckCircle, Trash2, Clock, User, BookOpen } from "lucide-react";
import clsx from "clsx";

interface IncomingQuestion {
    id: string;
    question: string;
    category: string;
    lesson_id: string;
    book_id: string;
    chapter?: number;
    verse_start?: number;
    verse_end?: number;
    user: string;
    created_by_name?: string;
    is_answered: boolean;
    created: string;
    expand?: {
        lesson_id?: { title: string };
        book_id?: { name: string; short_name: string };
        user?: { name: string; email: string };
    };
}

export default function IncomingQuestionsTab() {
    const [questions, setQuestions] = useState<IncomingQuestion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadQuestions();
    }, []);

    const loadQuestions = async () => {
        setLoading(true);
        try {
            // Wir laden nur Fragen, die KEINE Quiz-Fragen sind (keine order > 0 bzw. spezifisches Flag)
            // Oder wir filtern einfach nach Fragen, die einen User-Bezug haben
            const res = await pb.collection('questions').getFullList<IncomingQuestion>({
                filter: 'user != ""',
                sort: '-created',
                expand: 'lesson_id,user,book_id'
            });
            setQuestions(res);
        } catch (e) {
            console.error("Error loading incoming questions:", e);
        } finally {
            setLoading(false);
        }
    };

    const toggleAnswered = async (id: string, currentStatus: boolean) => {
        try {
            await pb.collection('questions').update(id, { is_answered: !currentStatus });
            setQuestions(prev => prev.map(q => q.id === id ? { ...q, is_answered: !currentStatus } : q));
        } catch (e) {
            console.error("Error updating question status:", e);
        }
    };

    const deleteQuestion = async (id: string) => {
        if (!confirm("Frage wirklich löschen?")) return;
        try {
            await pb.collection('questions').delete(id);
            setQuestions(prev => prev.filter(q => q.id !== id));
        } catch (e) {
            console.error("Error deleting question:", e);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <MessageCircle className="text-indigo-500" />
                    Eingegangene Fragen
                </h2>
                <span className="text-xs font-bold bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-widest">
                    {questions.length} Gesamt
                </span>
            </div>

            <div className="grid gap-4">
                {questions.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-slate-700">
                        <MessageCircle className="mx-auto text-zinc-300 mb-4" size={48} />
                        <p className="text-zinc-500 font-medium">Noch keine Fragen eingegangen.</p>
                    </div>
                ) : (
                    questions.map(q => (
                        <div
                            key={q.id}
                            className={clsx(
                                "bg-white dark:bg-slate-800 rounded-3xl border transition-all p-5 shadow-sm hover:shadow-md",
                                q.is_answered ? "border-emerald-100 dark:border-emerald-900/30 opacity-75" : "border-zinc-200 dark:border-slate-700"
                            )}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-slate-700 flex items-center justify-center text-zinc-500">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                                            {q.expand?.user?.name || q.created_by_name || "Anonymer User"}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Clock size={12} className="text-zinc-400" />
                                            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-tight">
                                                {new Date(q.created).toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => toggleAnswered(q.id, q.is_answered)}
                                        className={clsx(
                                            "p-2 rounded-xl border transition-all",
                                            q.is_answered
                                                ? "bg-emerald-100 border-emerald-200 text-emerald-600"
                                                : "bg-white dark:bg-slate-700 border-zinc-200 dark:border-slate-600 text-zinc-400 hover:text-emerald-500"
                                        )}
                                        title={q.is_answered ? "Als offen markieren" : "Als beantwortet markieren"}
                                    >
                                        <CheckCircle size={18} />
                                    </button>
                                    <button
                                        onClick={() => deleteQuestion(q.id)}
                                        className="p-2 rounded-xl border border-zinc-200 dark:border-slate-600 text-zinc-400 hover:text-red-500 bg-white dark:bg-slate-700 transition-all"
                                        title="Löschen"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <p className="text-lg leading-relaxed text-slate-800 dark:text-slate-200 mb-4 italic">
                                "{q.question}"
                            </p>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 border-t border-zinc-50 dark:border-slate-700/50">
                                {q.category === "bibeltext" && q.expand?.book_id && (
                                    <div className="flex items-center gap-2">
                                        <BookOpen size={14} className="text-indigo-500" />
                                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest"> Text: </span>
                                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
                                            {q.expand.book_id.name} {q.chapter}:{q.verse_start}{q.verse_end && q.verse_end > (q.verse_start || 0) ? `-${q.verse_end}` : ""}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <MessageCircle size={14} className="text-slate-400" />
                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest"> Bezug: </span>
                                    <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-tighter">
                                        {q.expand?.lesson_id?.title || "Allgemeine Frage"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
