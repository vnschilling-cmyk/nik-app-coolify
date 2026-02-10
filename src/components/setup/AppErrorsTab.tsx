"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { AlertTriangle, CheckCircle, Trash2, Clock, User, ExternalLink, Image as ImageIcon, ChevronDown, Circle } from "lucide-react";
import clsx from "clsx";

interface AppError {
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

export default function AppErrorsTab() {
    const [errors, setErrors] = useState<AppError[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    useEffect(() => {
        loadErrors();
    }, []);

    const loadErrors = async () => {
        setLoading(true);
        try {
            const res = await pb.collection('app_errors').getFullList<AppError>({
                sort: '-created',
                expand: 'user'
            });
            setErrors(res);
        } catch (e) {
            console.error("Error loading app errors:", e);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            await pb.collection('app_errors').update(id, { status: newStatus });
            setErrors(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
        } catch (e) {
            console.error("Error updating error status:", e);
        }
    };

    const deleteError = async (id: string) => {
        if (!confirm("Meldung wirklich löschen?")) return;
        try {
            await pb.collection('app_errors').delete(id);
            setErrors(prev => prev.filter(e => e.id !== id));
        } catch (e) {
            console.error("Error deleting error:", e);
        }
    };

    const getScreenshotUrl = (error: AppError) => {
        if (!error.screenshot) return null;
        return pb.files.getURL(error, error.screenshot);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <AlertTriangle className="text-red-500" />
                    App-Fehlermeldungen
                </h2>
                <span className="text-xs font-bold bg-red-100 text-red-600 px-3 py-1 rounded-full uppercase tracking-widest">
                    {errors.length} Meldungen
                </span>
            </div>

            <div className="grid gap-6">
                {errors.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-slate-700">
                        <CheckCircle className="mx-auto text-emerald-300 mb-4" size={48} />
                        <p className="text-zinc-500 font-medium">Keine Fehler gemeldet. Alles läuft prima!</p>
                    </div>
                ) : (
                    errors.map(err => (
                        <div
                            key={err.id}
                            className={clsx(
                                "bg-white dark:bg-slate-800 rounded-3xl border transition-all p-6 shadow-sm hover:shadow-md overflow-hidden",
                                err.status === 'erledigt' ? "border-emerald-100 dark:border-emerald-900/30 opacity-75" : "border-zinc-200 dark:border-slate-700"
                            )}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-slate-700 flex items-center justify-center text-zinc-500">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-slate-900 dark:text-white">
                                            {err.expand?.user?.name || err.created_by_name || "Anonymer Nutzer"}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Clock size={12} className="text-zinc-400" />
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                                {new Date(err.created).toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 relative">
                                    <div className="relative">
                                        <button
                                            onClick={() => setOpenDropdownId(openDropdownId === err.id ? null : err.id)}
                                            className={clsx(
                                                "text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border flex items-center gap-2 transition-all min-w-[120px] justify-between",
                                                err.status === 'erledigt'
                                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                                                    : err.status === 'in_bearbeitung'
                                                        ? "bg-amber-500/10 border-amber-500/20 text-amber-600"
                                                        : "bg-red-500/10 border-red-500/20 text-red-600"
                                            )}
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <Circle size={8} className="fill-current" />
                                                {err.status === 'neu' ? 'Neu' : err.status === 'in_bearbeitung' ? 'In Arbeit' : 'Erledigt'}
                                            </span>
                                            <ChevronDown size={14} className={clsx("transition-transform", openDropdownId === err.id && "rotate-180")} />
                                        </button>

                                        {openDropdownId === err.id && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => setOpenDropdownId(null)}
                                                />
                                                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 shadow-2xl rounded-2xl p-1.5 z-20 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                                    {[
                                                        { id: 'neu', label: 'Neu', color: 'text-red-500', bg: 'hover:bg-red-50 dark:hover:bg-red-500/10' },
                                                        { id: 'in_bearbeitung', label: 'In Arbeit', color: 'text-amber-500', bg: 'hover:bg-amber-50 dark:hover:bg-amber-500/10' },
                                                        { id: 'erledigt', label: 'Erledigt', color: 'text-emerald-500', bg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10' }
                                                    ].map((opt) => (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => {
                                                                updateStatus(err.id, opt.id);
                                                                setOpenDropdownId(null);
                                                            }}
                                                            className={clsx(
                                                                "w-full text-left px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2",
                                                                opt.bg,
                                                                opt.color,
                                                                err.status === opt.id && "bg-zinc-50 dark:bg-slate-700/50"
                                                            )}
                                                        >
                                                            <Circle size={6} className={clsx("fill-current", err.status === opt.id ? "opacity-100" : "opacity-0")} />
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => deleteError(err.id)}
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
                                        {err.description}
                                    </p>
                                </div>

                                {err.screenshot && (
                                    <div className="relative group rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/5 bg-slate-950 shadow-inner">
                                        <img
                                            src={getScreenshotUrl(err) || ""}
                                            alt="Screenshot des Fehlers"
                                            className="w-full h-auto max-h-[400px] object-contain cursor-pointer"
                                            onClick={() => window.open(getScreenshotUrl(err) || "", '_blank')}
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
