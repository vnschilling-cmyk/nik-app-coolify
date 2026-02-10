"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, Lightbulb, Trash2, Edit3, Clock, MessageSquare, Plus, HelpCircle, BookOpen, CheckCircle2 } from "lucide-react";
import clsx from "clsx";
import UnifiedFeedbackModal from "@/components/modals/UnifiedFeedbackModal";
import AskQuestionModal from "@/components/modals/AskQuestionModal";
import { usePermissions } from "@/hooks/usePermissions";

interface FeedbackItem {
    id: string;
    description: string;
    status: string;
    created: string;
    screenshot?: string;
    type: "bug" | "idea" | "question";
    created_by_name?: string;
    expand?: {
        user?: { name: string; email: string };
        lesson_id?: { title: string };
    };
    // Question specific
    category?: string;
    verse_ref?: string;
    admin_comment?: string;
    originalRef?: any;
}

export default function UserFeedbackTab() {
    const { user } = useAuth();
    const { isLeader } = usePermissions();
    const [items, setItems] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<FeedbackItem | undefined>(undefined);
    const [editingQuestion, setEditingQuestion] = useState<any>(null); // For questions
    const [filter, setFilter] = useState<'all' | 'bug' | 'idea' | 'question'>('all');

    useEffect(() => {
        loadUserFeedback();
    }, [user?.id]);

    const loadUserFeedback = async () => {
        if (!user?.id) {
            console.log("UserFeedbackTab: No user ID found, skipping load.");
            setLoading(false);
            return;
        }
        console.log("UserFeedbackTab: Loading feedback for user", user.id);
        setLoading(true);
        try {
            const userFilter = isLeader() ? "" : `user = "${user.id}"`;
            const questionsFilter = isLeader() ? "user != ''" : `user = "${user.id}"`;

            const [bugs, ideas, questionsRes] = await Promise.all([
                pb.collection('app_errors').getFullList({
                    filter: userFilter,
                    sort: '-created',
                    expand: 'user'
                }),
                pb.collection('app_ideas').getFullList({
                    filter: userFilter,
                    sort: '-created',
                    expand: 'user'
                }),
                pb.collection('questions').getFullList({
                    filter: questionsFilter,
                    sort: '-created',
                    expand: 'user,lesson_id'
                })
            ]);

            console.log("Questions Response:", questionsRes);
            if (questionsRes.length > 0) {
                console.log("First Question Expand:", questionsRes[0].expand);
            }

            const questions = questionsRes.map(q => ({
                id: q.id,
                type: 'question' as const,
                status: q.is_answered ? 'beantwortet' : 'offen',
                description: q.question,
                created: q.created,
                admin_comment: q.answer,
                category: q.category,
                verse_ref: q.verse_ref,
                expand: q.expand,
                originalRef: q
            })) as FeedbackItem[];

            let combined: FeedbackItem[] = [
                ...(bugs as any[]).map(b => ({ ...b, type: "bug" as const })),
                ...(ideas as any[]).map(i => ({ ...i, type: "idea" as const })),
                ...questions
            ].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

            // Determine if we should filter the combined list. 
            // The previous logic filtered logic in Render, but we can do it here too if we want to filter the `items` state.
            // But usually better to filter in render or memo.
            // The previous logic I attempted inserted filtering here.

            // Let's filter here for simplicity as the previous attempt did.
            if (filter !== 'all') {
                combined = combined.filter(i => i.type === filter);
            }

            setItems(combined);
        } catch (e) {
            console.error("Error loading user feedback:", e);
        } finally {
            setLoading(false);
        }
    };

    // Create a listener for filter changes to reload? 
    // No, better to just filter the `items` in render or reload when filter changes.
    // If we filter in `loadUserFeedback`, we must call it when filter changes.
    useEffect(() => {
        loadUserFeedback();
    }, [filter]);


    const deleteItem = async (item: FeedbackItem) => {
        if (item.type === 'question') {
            if (!confirm("Frage wirklich löschen?")) return;
            try {
                await pb.collection('questions').delete(item.id);
                setItems(prev => prev.filter(i => i.id !== item.id));
            } catch (e) {
                console.error("Error deleting question:", e);
                alert("Fehler beim Löschen.");
            }
            return;
        }

        // Status restriction removed as per user request
        if (!confirm("Diese Meldung wirklich löschen?")) return;

        try {
            const collection = item.type === "bug" ? "app_errors" : "app_ideas";
            await pb.collection(collection).delete(item.id);
            setItems(prev => prev.filter(i => i.id !== item.id));
        } catch (e) {
            console.error("Error deleting feedback item:", e);
            alert("Fehler beim Löschen.");
        }
    };

    if (loading && items.length === 0) { // Only show loading if we have no items (initial load)
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6 animate-fadeIn pb-24">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <MessageSquare className="text-indigo-500" />
                    {isLeader() ? "Alle Mitteilungen" : "Meine Mitteilungen"}
                </h2>
                <span className="text-xs font-bold bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-widest">
                    {items.length} Einträge
                </span>
            </div>
            {/* Filter Tabs */}
            <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-white/5 rounded-xl self-start overflow-x-auto">
                <button
                    onClick={() => setFilter('all')}
                    className={clsx(
                        "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                        filter === 'all'
                            ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    )}
                >
                    Alle
                </button>
                <button
                    onClick={() => setFilter('question')}
                    className={clsx(
                        "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1",
                        filter === 'question'
                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                            : "text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                    )}
                >
                    <HelpCircle size={14} /> Fragen
                </button>
                <button
                    onClick={() => setFilter('bug')}
                    className={clsx(
                        "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1",
                        filter === 'bug'
                            ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                            : "text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
                    )}
                >
                    <AlertTriangle size={14} /> Fehler
                </button>
                <button
                    onClick={() => setFilter('idea')}
                    className={clsx(
                        "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1",
                        filter === 'idea'
                            ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                            : "text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400"
                    )}
                >
                    <Lightbulb size={14} /> Ideen
                </button>
            </div>

            {!isLeader() && (
                <button
                    onClick={() => {
                        setEditingItem(undefined);
                        setIsModalOpen(true);
                    }}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all mb-2"
                >
                    <Plus size={20} /> Neue Nachricht
                </button>
            )}

            <div className="grid gap-4">
                {items.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-slate-700">
                        <MessageSquare className="mx-auto text-zinc-300 mb-4" size={48} />
                        <p className="text-zinc-500 font-medium">Keine Einträge gefunden.</p>
                    </div>
                ) : (
                    items.map(item => (
                        <div
                            key={`${item.type}-${item.id}`}
                            className={clsx(
                                "bg-white dark:bg-slate-800 rounded-3xl border transition-all p-5 shadow-sm hover:shadow-md",
                                (item.status === 'erledigt' || item.status === 'beantwortet') ? "opacity-75 border-emerald-100 dark:border-emerald-900/30" : "border-zinc-200 dark:border-slate-700"
                            )}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <div className={clsx(
                                        "w-8 h-8 rounded-lg flex items-center justify-center",
                                        item.type === "bug" ? "bg-red-50 dark:bg-red-900/30 text-red-600" :
                                            item.type === "idea" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600" :
                                                item.category === "bibeltext" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600" : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"
                                    )}>
                                        {item.type === "bug" && <AlertTriangle size={16} />}
                                        {item.type === "idea" && <Lightbulb size={16} />}
                                        {item.type === "question" && (item.category === 'bibeltext' ? <BookOpen size={16} /> : <HelpCircle size={16} />)}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className={clsx(
                                                "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
                                                (item.status === 'erledigt' || item.status === 'beantwortet') ? "bg-emerald-500 text-white" :
                                                    (item.status === 'in_bearbeitung' || item.status === 'offen') ? "bg-amber-500 text-white" :
                                                        "bg-zinc-200 dark:bg-slate-700 text-zinc-600 dark:text-zinc-300"
                                            )}>
                                                {item.status === 'neu' && 'Neu'}
                                                {item.status === 'in_bearbeitung' && 'In Arbeit'}
                                                {item.status === 'erledigt' && 'Erledigt'}
                                                {item.status === 'offen' && 'Offen'}
                                                {item.status === 'beantwortet' && 'Beantwortet'}
                                            </span>
                                            {isLeader() && (
                                                <span className="text-[10px] font-bold text-zinc-400 uppercase">
                                                    von {item.expand?.user?.name || item.expand?.user?.email || item.created_by_name || "Anonymer Nutzer"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {(!isLeader()) && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    if (item.type === 'question') {
                                                        setEditingQuestion(item.originalRef);
                                                    } else {
                                                        setEditingItem(item);
                                                        setIsModalOpen(true);
                                                    }
                                                }}
                                                className="p-2 rounded-xl border border-zinc-100 dark:border-white/5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
                                                title="Bearbeiten"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                onClick={() => deleteItem(item)}
                                                className="p-2 rounded-xl border border-zinc-100 dark:border-white/5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                                                title="Löschen"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
                                {item.description}
                            </p>

                            {item.verse_ref && (
                                <p className="text-xs font-mono text-indigo-500 mt-1">{item.verse_ref}</p>
                            )}

                            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                <span className="flex items-center gap-1.5">
                                    <Clock size={12} />
                                    {new Date(item.created).toLocaleDateString("de-DE")}
                                </span>
                                <span>{item.type === "bug" ? "App-Fehler" : item.type === "idea" ? "App-Verbesserung" : "Frage"}</span>
                            </div>

                            {item.admin_comment && (
                                <div className="mt-3 bg-zinc-50 dark:bg-black/20 rounded-lg p-3 text-sm border-l-2 border-indigo-500">
                                    <p className="font-bold text-indigo-600 dark:text-indigo-400 text-xs uppercase mb-1">
                                        {item.type === 'question' ? 'Antwort' : 'Kommentar des Teams'}
                                    </p>
                                    <p className="text-zinc-600 dark:text-zinc-300">{item.admin_comment}</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <UnifiedFeedbackModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingItem(undefined);
                    loadUserFeedback();
                }}
                initialData={editingItem as any}
            />
            {/* Question Edit Modal */}
            <AskQuestionModal
                isOpen={!!editingQuestion}
                onClose={() => setEditingQuestion(null)}
                initialData={editingQuestion}
                onSaved={loadUserFeedback}
            />
        </div>
    );
}
