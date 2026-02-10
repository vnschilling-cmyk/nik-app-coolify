"use client";

import { useState } from "react";
import { X, Send, Image as ImageIcon, AlertTriangle } from "lucide-react";
import { pb } from "@/lib/pocketbase";
import { useAuth } from "@/hooks/useAuth";

interface BugReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BugReportModal({ isOpen, onClose }: BugReportModalProps) {
    const { user } = useAuth();
    const [description, setDescription] = useState("");
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

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
            if (user?.id) {
                formData.append("user", user.id);
            }
            formData.append("created_by_name", user?.name || user?.email || "Anonymer Nutzer");
            formData.append("status", "neu");

            if (screenshot) {
                formData.append("screenshot", screenshot);
            }

            await pb.collection("app_errors").create(formData);

            alert("Vielen Dank! Dein Fehlerbericht wurde gesendet.");
            onClose();
            // Reset form
            setDescription("");
            setScreenshot(null);
            setPreviewUrl(null);
        } catch (error: any) {
            console.error("Fehler beim Senden des Berichts:", error);
            let detailMsg = error.message;
            if (error.response?.data) {
                detailMsg += ": " + JSON.stringify(error.response.data);
            }
            alert("Fehler beim Senden: " + detailMsg);
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
                        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                            <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
                        </div>
                        <h3 className="font-heading font-bold text-xl text-slate-900 dark:text-white">Fehler melden</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-slate-700 rounded-full transition-colors text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                        aria-label="Schließen"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="bug_description" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 block">
                            Was ist passiert? *
                        </label>
                        <textarea
                            id="bug_description"
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Beschreibe den Fehler so genau wie möglich..."
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-slate-700/50 border border-zinc-200 dark:border-white/5 rounded-2xl min-h-[120px] text-sm focus:ring-2 focus:ring-red-500 transition-all outline-none"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 block">
                            Screenshot (Optional)
                        </label>
                        <div className="relative group">
                            {previewUrl ? (
                                <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/5 aspect-video bg-slate-950 shadow-inner group/preview">
                                    <img
                                        src={previewUrl}
                                        alt="Vorschau"
                                        className="w-full h-full object-contain cursor-pointer"
                                        onClick={() => document.getElementById('bug_screenshot_input')?.click()}
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
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 pointer-events-none transition-opacity">
                                        <p className="text-white text-[10px] font-bold uppercase tracking-wider">Klicken zum Ändern</p>
                                    </div>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-zinc-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5 transition-all group">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <ImageIcon className="w-8 h-8 text-zinc-300 group-hover:text-red-400 transition-colors mb-2" />
                                        <p className="text-xs text-zinc-400 font-medium">Klicke zum Hochladen</p>
                                    </div>
                                    <input
                                        id="bug_screenshot_input"
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
                        className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-700 shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Send size={18} /> Fehler absenden
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
