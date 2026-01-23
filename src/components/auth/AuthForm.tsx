"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function AuthForm() {
    const { login, register, loginWithProvider, isLoading } = useAuth();
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            if (isLoginMode) {
                await login(email, password);
            } else {
                if (password !== passwordConfirm) {
                    setError("Passwörter stimmen nicht überein.");
                    return;
                }
                await register(email, password, passwordConfirm);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Ein Fehler ist aufgetreten.");
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm max-w-sm mx-auto">
            <div className="flex mb-6 border-b border-zinc-200 dark:border-zinc-800">
                <button
                    className={`flex-1 pb-2 text-sm font-medium transition-colors ${isLoginMode ? "text-blue-600 border-b-2 border-blue-600" : "text-zinc-500"}`}
                    onClick={() => setIsLoginMode(true)}
                >
                    Anmelden
                </button>
                <button
                    className={`flex-1 pb-2 text-sm font-medium transition-colors ${!isLoginMode ? "text-blue-600 border-b-2 border-blue-600" : "text-zinc-500"}`}
                    onClick={() => setIsLoginMode(false)}
                >
                    Registrieren
                </button>
            </div>

            <div className="space-y-3 mb-6">
                <button
                    onClick={() => loginWithProvider("google")}
                    type="button"
                    className="w-full flex items-center justify-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
                >
                    {/* Google G Icon */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M23.52 12.29C23.52 11.43 23.44 10.6 23.3 9.8H12V14.5H18.46C18.18 15.98 17.33 17.24 16.03 18.1V21.1H19.92C22.2 19 23.52 15.92 23.52 12.29Z" fill="#4285F4" />
                        <path d="M12 24C15.24 24 17.96 22.92 19.93 21.09L16.03 18.09C14.95 18.82 13.57 19.25 12.01 19.25C8.87 19.25 6.21 17.13 5.26 14.3H1.23V17.42C3.18 21.3 7.21 24 12 24Z" fill="#34A853" />
                        <path d="M5.26 14.29C5.02 13.56 4.89 12.79 4.89 12C4.89 11.21 5.02 10.43 5.26 9.7V6.58H1.23C0.45 8.16 0 9.99 0 12C0 14.01 0.45 15.84 1.23 17.42L5.26 14.29Z" fill="#FBBC05" />
                        <path d="M12 4.75C13.77 4.75 15.35 5.36 16.6 6.55L20.02 3.13C17.96 1.2 15.24 0 12 0C7.21 0 3.18 2.7 1.23 6.58L5.26 9.7C6.21 6.87 8.87 4.75 12 4.75Z" fill="#EA4335" />
                    </svg>
                    Google
                </button>
                <button
                    onClick={() => loginWithProvider("apple")}
                    type="button"
                    className="w-full flex items-center justify-center gap-2 bg-black text-white p-2.5 rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 19.09C16.89 19.33 16.68 19.63 16.42 20.02C15.86 20.89 15.34 21.6 14.54 21.61C13.73 21.63 13.5 21.13 12.59 21.13C11.66 21.13 11.39 21.58 10.66 21.61C9.9 21.63 9.3 20.84 8.76 20.06C6.54 16.84 4.83 11 8.87 8.9C10.5 8.08 11.58 9.07 12.3 9.07C13 9.07 14.39 7.78 16.03 8.05C16.71 8.08 17.7 8.33 18.5 9.49C18.43 9.54 16.72 10.53 16.76 12.63C16.81 15.11 18.99 15.93 19.07 15.97C19.06 16.02 18.72 17.2 17.92 18.36C17.5 18.95 17.05 19.09 17.05 19.09ZM15.24 6.27C15.94 5.41 16.42 4.23 16.29 3C15.24 3.03 13.98 3.73 13.23 4.61C12.56 5.37 12.01 6.61 12.18 7.76C13.33 7.85 14.53 7.15 15.24 6.27Z" />
                    </svg>
                    Apple
                </button>

                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                    <span className="flex-shrink-0 mx-4 text-zinc-400 text-xs text-center uppercase tracking-wide">oder mit E-Mail</span>
                    <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">E-Mail</label>
                    <input
                        type="email"
                        required
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Passwort</label>
                    <input
                        type="password"
                        required
                        minLength={5}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                {!isLoginMode && (
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Passwort bestätigen</label>
                        <input
                            type="password"
                            required
                            minLength={5}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                        />
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {isLoading ? "Lädt..." : (isLoginMode ? "Anmelden" : "Konto erstellen")}
                </button>
            </form>
        </div>
    );
}
