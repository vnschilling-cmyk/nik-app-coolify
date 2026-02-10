"use client";

import { useState, useEffect } from "react";
import { X, Send, Image as ImageIcon, AlertTriangle, Lightbulb } from "lucide-react";
import { pb } from "@/lib/pocketbase";
import { useAuth } from "@/hooks/useAuth";
import clsx from "clsx";

interface UnifiedFeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: {
        id: string;
        description: string;
        screenshot?: string;
        type: "bug" | "idea";
    };
}

export default function UnifiedFeedbackModal({ isOpen, onClose, initialData }: UnifiedFeedbackModalProps) {
    const { user } = useAuth();
    const [type, setType] = useState<"bug" | "idea">("bug");
    const [description, setDescription] = useState("");
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData?.id) {
                setType(initialData.type);
                setDescription(initialData.description);
                setPreviewUrl(initialData.screenshot ? pb.files.getURL(initialData as any, initialData.screenshot) : null);
            } else {
                // Reset for new entry
                setType("bug");
                setDescription("");
                setScreenshot(null);
                setPreviewUrl(null);
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setScreenshot(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) return;

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append("description", description);
            if (screenshot) {
                formData.append("screenshot", screenshot);
            }

            const collection = type === "bug" ? "app_errors" : "app_ideas";

            if (initialData?.id) {
                await pb.collection(collection).update(initialData.id, formData);
                alert("Deine Mitteilung wurde aktualisiert.");
            } else {
                formData.append("user", user?.id || "");
                formData.append("created_by_name", user?.name || user?.email || "Anonymer Nutzer");
                formData.append("status", "neu");
                await pb.collection(collection).create(formData);
                alert("Vielen Dank! Deine Mitteilung wurde gesendet.");
            }

            onClose();
        } catch (error: any) {
            console.error("Fehler beim Senden:", error);
            alert("Fehler beim Senden: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className={clsx(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                            type === "bug" ? "bg-red-50 dark:bg-red-900/30" : "bg-blue-50 dark:bg-blue-900/30"
                        )}>
                            {type === "bug" ? (
                                <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
                            ) : (
                                <Lightbulb className="text-blue-600 dark:text-blue-400" size={20} />
                            )}
                        </div>
                        <h3 className="font-heading font-bold text-xl text-slate-900 dark:text-white">
                            {initialData?.id ? "Mitteilung bearbeiten" : "Feedback & Support"}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-slate-700 rounded-full transition-colors text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                        aria-label="Schließen"
                    >
                        <X size={20} />
                    </button>
                </div>

                {!initialData?.id && (
                    <div className="bg-zinc-100 dark:bg-slate-900/50 p-1 rounded-2xl flex gap-1 mb-6">
                        <button
                            type="button"
                            onClick={() => setType("bug")}
                            className={clsx(
                                "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                type === "bug"
                                    ? "bg-white dark:bg-slate-700 shadow-sm text-red-600 dark:text-red-400"
                                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            )}
                        >
                            <AlertTriangle size={14} /> Fehler
                        </button>
                        <button
                            type="button"
                            onClick={() => setType("idea")}
                            className={clsx(
                                "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                type === "idea"
                                    ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400"
                                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            )}
                        >
                            <Lightbulb size={14} /> Idee
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="feedback_description" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 block">
                            {type === "bug" ? "Fehlerbeschreibung *" : "Deine Vision / Idee *"}
                        </label>
                        <textarea
                            id="feedback_description"
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={type === "bug" ? "Was ist passiert? Was hätte passieren sollen?" : "Beschreibe deine Idee so genau wie möglich..."}
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-slate-700/50 border border-zinc-200 dark:border-white/5 rounded-2xl min-h-[120px] text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 block">
                            Screenshot / Bild (Optional)
                        </label>
                        <div className="relative group">
                            {previewUrl ? (
                                <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/5 aspect-video bg-slate-950 shadow-inner group/preview">
                                    <img
                                        src={previewUrl}
                                        alt="Vorschau"
                                        className="w-full h-full object-contain cursor-pointer"
                                        onClick={() => document.getElementById('feedback_screenshot_input')?.click()}
                                        title="Bild ändern"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setScreenshot(null);
                                            setPreviewUrl(null);
                                        }}
                                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
                                        title="Bild entfernen"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-zinc-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5 transition-all group">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <ImageIcon className="w-8 h-8 text-zinc-300 group-hover:text-indigo-400 transition-colors mb-2" />
                                        <p className="text-xs text-zinc-400 font-medium">Bild hochladen</p>
                                    </div>
                                    <input
                                        id="feedback_screenshot_input"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving || !description.trim()}
                        className={clsx(
                            "w-full py-4 text-white rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]",
                            type === "bug" ? "bg-red-600 hover:bg-red-700 shadow-red-500/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                        )}
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Send size={18} /> {initialData?.id ? "Änderungen speichern" : "Absenden"}
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
