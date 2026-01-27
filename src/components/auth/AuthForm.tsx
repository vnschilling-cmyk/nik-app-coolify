"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function AuthForm() {
    const { login, isLoading } = useAuth();
    // const { register, loginWithProvider } = useAuth(); // Unused for now
    const [identity, setIdentity] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [resetSent, setResetSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            let loginIdentity = identity.trim();

            // Auto-lowercase for mobile convenience if it doesn't look like a complex mixed-case username
            if (!loginIdentity.includes('@')) {
                loginIdentity = loginIdentity.toLowerCase()
                    .replace(/ä/g, 'ae')
                    .replace(/ö/g, 'oe')
                    .replace(/ü/g, 'ue')
                    .replace(/ß/g, 'ss')
                    .replace(/[^a-z0-9\s]/g, '') // Keep spaces for now
                    .replace(/\s+/g, ''); // Then remove them

                // Internal Email Strategy
                loginIdentity = `${loginIdentity}@nik-app.local`;
            }

            console.log(`Login attempt: "${identity}" -> "${loginIdentity}"`);
            await login(loginIdentity, password);
        } catch (err: any) {
            console.error("Auth Error Object:", err);

            let message = "Login fehlgeschlagen. Bitte prüfe Name und Passwort.";
            if (err.status === 0) {
                message = "Server nicht erreichbar. Bist du im selben WLAN wie der PC?";
            } else if (err.status === 400) {
                message = "Anmeldedaten ungültig. Prüfe Name und Passwort.";
            } else if (err.message) {
                message = err.message;
            }

            setError(message);
        }
    };

    const handleForgotPassword = async () => {
        if (!identity) {
            setError("Bitte gib deine E-Mail-Adresse ein, um das Passwort zurückzusetzen.");
            return;
        }
        try {
            setError(null);
            // We need to import pb or pass this capability to useAuth/AuthForm
            // Direct import to keep it simple here, or mock if prefered.
            // Let's use the pb instance from props or import. 
            // Since useAuth uses direct import, we can do:
            // await pb.collection('users').requestPasswordReset(email);
            // But better to import pb here.
            const { pb } = require('@/lib/pocketbase');
            // WARNING: requestPasswordReset requires EMAIL. If 'identity' is a username, this will likely fail or do nothing if not an email format.
            // For now, we pass identity assuming user might type email for reset.
            await pb.collection('users').requestPasswordReset(identity);
            setResetSent(true);
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError("Konnte keine E-Mail senden. Ist die Adresse/Name korrekt?");
        }
    };

    if (resetSent) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-zinc-200 dark:border-slate-600 shadow-sm max-w-sm mx-auto text-center animate-fadeIn">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-2">E-Mail versendet!</h3>
                <p className="text-sm text-zinc-500 mb-6">
                    Wir haben einen Link zum Zurücksetzen deines Passworts an <strong>{identity}</strong> gesendet.
                </p>
                <button
                    onClick={() => setResetSent(false)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                    Zurück zur Anmeldung
                </button>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold text-center mb-6 py-2 border-b border-zinc-100 dark:border-slate-700">CBG Jugend</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Name (Vorname Nachname)</label>
                    <input
                        type="text"
                        required
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={identity}
                        onChange={(e) => setIdentity(e.target.value)}
                        placeholder="Vorname Nachname"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Passwort</label>
                    <input
                        type="password"
                        required
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <div className="text-right mt-1">
                        <button
                            type="button"
                            onClick={handleForgotPassword}
                            className="text-xs text-blue-600 hover:text-blue-700"
                        >
                            Passwort vergessen?
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm shadow-blue-500/30"
                >
                    {isLoading ? "Lädt..." : "Login"}
                </button>
            </form>
        </div>
    );

}
