"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, Lightbulb, Trash2, Edit3, Clock, MessageSquare, Plus } from "lucide-react";
import clsx from "clsx";
import UnifiedFeedbackModal from "@/components/modals/UnifiedFeedbackModal";
import { usePermissions } from "@/hooks/usePermissions";

interface FeedbackItem {
    id: string;
    description: string;
    status: string;
    created: string;
    screenshot?: string;
    type: "bug" | "idea";
    created_by_name?: string;
    expand?: {
        user?: { name: string; email: string };
    };
}

export default function UserFeedbackTab() {
    const { user } = useAuth();
    const { isLeader } = usePermissions();
    const [items, setItems] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<FeedbackItem | undefined>(undefined);

    useEffect(() => {
        loadUserFeedback();
    }, [user?.id]);

    const loadUserFeedback = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const filter = isLeader() ? "" : `user = "${user.id}"`;

            const [bugs, ideas] = await Promise.all([
                pb.collection('app_errors').getFullList({
                    filter,
                    sort: '-created',
                    expand: 'user'
                }),
                pb.collection('app_ideas').getFullList({
                    filter,
                    sort: '-created',
                    expand: 'user'
                })
            ]);

            const combined: FeedbackItem[] = [
                ...(bugs as any[]).map(b => ({ ...b, type: "bug" as const })),
                ...(ideas as any[]).map(i => ({ ...i, type: "idea" as const }))
            ].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

            setItems(combined);
        } catch (e) {
            console.error("Error loading user feedback:", e);
        } finally {
            setLoading(false);
        }
    };

    const deleteItem = async (item: FeedbackItem) => {
        if (item.status !== 'neu') {
            alert("Nur Meldungen im Status 'Neu' können gelöscht werden.");
            return;
        }
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

    if (loading) {
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
                        <p className="text-zinc-500 font-medium">Du hast noch keine Nachrichten gesendet.</p>
                    </div>
                ) : (
                    items.map(item => (
                        <div
                            key={`${item.type}-${item.id}`}
                            className={clsx(
                                "bg-white dark:bg-slate-800 rounded-3xl border transition-all p-5 shadow-sm hover:shadow-md",
                                item.status === 'erledigt' ? "opacity-75 border-emerald-100 dark:border-emerald-900/30" : "border-zinc-200 dark:border-slate-700"
                            )}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <div className={clsx(
                                        "w-8 h-8 rounded-lg flex items-center justify-center",
                                        item.type === "bug" ? "bg-red-50 dark:bg-red-900/30 text-red-600" : "bg-blue-50 dark:bg-blue-900/30 text-blue-600"
                                    )}>
                                        {item.type === "bug" ? <AlertTriangle size={16} /> : <Lightbulb size={16} />}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className={clsx(
                                                "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
                                                item.status === 'erledigt' ? "bg-emerald-500 text-white" :
                                                    item.status === 'in_bearbeitung' ? "bg-amber-500 text-white" :
                                                        "bg-zinc-200 dark:bg-slate-700 text-zinc-600 dark:text-zinc-300"
                                            )}>
                                                {item.status === 'neu' ? 'Neu' : item.status === 'in_bearbeitung' ? 'In Arbeit' : 'Erledigt'}
                                            </span>
                                            {isLeader() && (
                                                <span className="text-[10px] font-bold text-zinc-400 uppercase">
                                                    von {item.expand?.user?.name || item.created_by_name || "Anonymer Nutzer"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {(!isLeader() && item.status === 'neu') && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setEditingItem(item);
                                                    setIsModalOpen(true);
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

                            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                <span className="flex items-center gap-1.5">
                                    <Clock size={12} />
                                    {new Date(item.created).toLocaleDateString("de-DE")}
                                </span>
                                <span>{item.type === "bug" ? "App-Fehler" : "App-Verbesserung"}</span>
                            </div>
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
                initialData={editingItem}
            />
        </div>
    );
}
