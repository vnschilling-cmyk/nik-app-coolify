"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { Lightbulb, CheckCircle, Trash2, Clock, User, ExternalLink, Image as ImageIcon, ChevronDown, Circle } from "lucide-react";
import clsx from "clsx";

interface AppIdea {
    id: string;
    description: string;
    user: string;
    created_by_name: string;
    screenshot: string;
    status: string;
    created: string;
    collectionId: string;
    collectionName: string;
    expand?: {
        user?: { name: string; email: string };
    };
}

export default function AppIdeasTab() {
    const [ideas, setIdeas] = useState<AppIdea[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    useEffect(() => {
        loadIdeas();
    }, []);

    const loadIdeas = async () => {
        setLoading(true);
        try {
            const res = await pb.collection('app_ideas').getFullList<AppIdea>({
                sort: '-created',
                expand: 'user'
            });
            setIdeas(res);
        } catch (e) {
            console.error("Error loading app ideas:", e);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            await pb.collection('app_ideas').update(id, { status: newStatus });
            setIdeas(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
        } catch (e) {
            console.error("Error updating idea status:", e);
        }
    };

    const deleteIdea = async (id: string) => {
        if (!confirm("Idee wirklich löschen?")) return;
        try {
            await pb.collection('app_ideas').delete(id);
            setIdeas(prev => prev.filter(e => e.id !== id));
        } catch (e) {
            console.error("Error deleting idea:", e);
        }
    };

    const getScreenshotUrl = (idea: AppIdea) => {
        if (!idea.screenshot) return null;
        return pb.files.getURL(idea, idea.screenshot);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Lightbulb className="text-blue-500" />
                    App-Ideen & Vorschläge
                </h2>
                <span className="text-xs font-bold bg-blue-100 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest">
                    {ideas.length} Ideen
                </span>
            </div>

            <div className="grid gap-6">
                {ideas.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-slate-700">
                        <Lightbulb className="mx-auto text-blue-300 mb-4" size={48} />
                        <p className="text-zinc-500 font-medium">Bisher wurden keine Ideen eingereicht. Sei der Erste!</p>
                    </div>
                ) : (
                    ideas.map(idea => (
                        <div
                            key={idea.id}
                            className={clsx(
                                "bg-white dark:bg-slate-800 rounded-3xl border transition-all p-6 shadow-sm hover:shadow-md overflow-hidden",
                                idea.status === 'erledigt' ? "border-emerald-100 dark:border-emerald-900/30 opacity-75" : "border-zinc-200 dark:border-slate-700"
                            )}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-slate-700 flex items-center justify-center text-zinc-500">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-slate-900 dark:text-white">
                                            {idea.expand?.user?.name || idea.created_by_name || "Anonymer Nutzer"}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Clock size={12} className="text-zinc-400" />
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                                {new Date(idea.created).toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 relative">
                                    <div className="relative">
                                        <button
                                            onClick={() => setOpenDropdownId(openDropdownId === idea.id ? null : idea.id)}
                                            className={clsx(
                                                "text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border flex items-center gap-2 transition-all min-w-[120px] justify-between",
                                                idea.status === 'erledigt'
                                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                                                    : idea.status === 'in_bearbeitung'
                                                        ? "bg-amber-500/10 border-amber-500/20 text-amber-600"
                                                        : "bg-amber-500/10 border-amber-500/20 text-blue-600"
                                            )}
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <Circle size={8} className="fill-current" />
                                                {idea.status === 'neu' ? 'Neu' : idea.status === 'in_bearbeitung' ? 'In Arbeit' : 'Erledigt'}
                                            </span>
                                            <ChevronDown size={14} className={clsx("transition-transform", openDropdownId === idea.id && "rotate-180")} />
                                        </button>

                                        {openDropdownId === idea.id && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => setOpenDropdownId(null)}
                                                />
                                                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 shadow-2xl rounded-2xl p-1.5 z-20 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                                    {[
                                                        { id: 'neu', label: 'Neu', color: 'text-blue-500', bg: 'hover:bg-blue-50 dark:hover:bg-blue-500/10' },
                                                        { id: 'in_bearbeitung', label: 'In Arbeit', color: 'text-amber-500', bg: 'hover:bg-amber-50 dark:hover:bg-amber-500/10' },
                                                        { id: 'erledigt', label: 'Erledigt', color: 'text-emerald-500', bg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10' }
                                                    ].map((opt) => (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => {
                                                                updateStatus(idea.id, opt.id);
                                                                setOpenDropdownId(null);
                                                            }}
                                                            className={clsx(
                                                                "w-full text-left px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2",
                                                                opt.bg,
                                                                opt.color,
                                                                idea.status === opt.id && "bg-zinc-50 dark:bg-slate-700/50"
                                                            )}
                                                        >
                                                            <Circle size={6} className={clsx("fill-current", idea.status === opt.id ? "opacity-100" : "opacity-0")} />
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => deleteIdea(idea.id)}
                                        className="p-2.5 rounded-xl border border-zinc-200 dark:border-slate-600 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 bg-white dark:bg-slate-700 transition-all shadow-sm"
                                        title="Löschen"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-zinc-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-zinc-100 dark:border-white/5">
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                        {idea.description}
                                    </p>
                                </div>

                                {idea.screenshot && (
                                    <div className="relative group rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/5 bg-slate-950 shadow-inner">
                                        <img
                                            src={getScreenshotUrl(idea) || ""}
                                            alt="Screenshot der Idee"
                                            className="w-full h-auto max-h-[400px] object-contain cursor-pointer"
                                            onClick={() => window.open(getScreenshotUrl(idea) || "", '_blank')}
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                            <div className="bg-white/90 p-2 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-900 shadow-xl">
                                                <ExternalLink size={14} /> In neuem Tab öffnen
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
