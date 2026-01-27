"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Lock, Check, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function ForcePasswordChange() {
    const { user, changePassword, logout } = useAuth();
    const [oldPassword, setOldPassword] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    // Visibility toggles
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Only show if user is logged in AND has NOT changed password yet
    if (!user || user.password_changed) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!oldPassword) {
            setError("Bitte aktuelles Passwort eingeben.");
            return;
        }

        if (password.length < 8) {
            setError("Neues Passwort muss mindestens 8 Zeichen lang sein.");
            return;
        }

        if (password !== confirm) {
            setError("Passwörter stimmen nicht überein.");
            return;
        }

        setIsLoading(true);
        try {
            // Now calling with 3 arguments!
            await changePassword(password, confirm, oldPassword);
            // No reload needed! State update in useAuth will cause this component 
            // to re-render and return null (hiding itself).
        } catch (err: any) {
            // Translate common PB errors if possible
            let msg = err.message || "Fehler beim Ändern des Passworts.";
            if (msg.includes("Failed to update record")) {
                msg = "Konnte Profil nicht aktualisieren. Prüfe dein aktuelles Passwort.";
            }
            if (err.data?.oldPassword) {
                msg = "Das aktuelle Passwort ist falsch.";
            }
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md p-8 rounded-xl shadow-2xl border border-zinc-200 dark:border-slate-700">
                <div className="text-center mb-8">
                    {/* Blue Icon Background to match Login */}
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-blue-600 dark:text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                        Neues Passwort erforderlich
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Bitte gib dein aktuelles Passwort (Start-Passwort) ein und wähle dann ein neues.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-start gap-3 border border-red-100 dark:border-red-900/50">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Old Password */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Aktuelles Passwort</label>
                        <div className="relative">
                            <input
                                type={showOld ? "text" : "password"}
                                required
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-10"
                                placeholder="Start-Passwort"
                            />
                            <button
                                type="button"
                                onClick={() => setShowOld(!showOld)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                            >
                                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Neues Passwort</label>
                        <div className="relative">
                            <input
                                type={showNew ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-10"
                                placeholder="Min. 8 Zeichen"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                            >
                                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Passwort bestätigen</label>
                        <div className="relative">
                            <input
                                type={showConfirm ? "text" : "password"}
                                required
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-10"
                                placeholder="Wiederholen"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                            >
                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm shadow-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? "Speichert..." : (
                            <>
                                <Check className="w-5 h-5" />
                                Passwort speichern
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={logout}
                        className="w-full py-2 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    >
                        Abbrechen & Logout
                    </button>
                </form>
            </div>
        </div>
    );
}
