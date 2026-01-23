"use client";

import { useAuth } from "@/hooks/useAuth";
import AuthForm from "@/components/auth/AuthForm";

export default function ProfilePage() {
    const { user, logout } = useAuth();

    if (!user) {
        return (
            <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
                <h1 className="text-2xl font-bold mb-8">Anmelden</h1>
                <AuthForm />
            </div>
        );
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">Mein Profil</h1>

            <div className="bg-zinc-100 dark:bg-zinc-900 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center text-3xl border border-zinc-200 dark:border-zinc-800">
                👤
            </div>
            <div className="text-center mb-8">
                <h2 className="font-semibold text-lg">{user.email}</h2>
                <p className="text-zinc-500 text-sm">Mitglied</p>
                <div className="mt-1 inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                    ID: {user.id.slice(0, 6)}...
                </div>
            </div>

            <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex justify-between items-center active:scale-[0.98] transition-transform">
                    <span>Einstellungen</span>
                    <span className="text-zinc-400">›</span>
                </button>
                <a href="/setup" className="w-full text-left px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-lg flex justify-between items-center active:scale-[0.98] transition-transform">
                    <span className="text-indigo-700 dark:text-indigo-300">📚 Inhalte verwalten</span>
                    <span className="text-indigo-400">›</span>
                </a>
                <button className="w-full text-left px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex justify-between items-center active:scale-[0.98] transition-transform">
                    <span>Notizen exportieren</span>
                    <span className="text-zinc-400">›</span>
                </button>

                <button
                    onClick={logout}
                    className="w-full text-left px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-lg flex justify-between items-center mt-6 active:scale-[0.98] transition-transform"
                >
                    <span>Abmelden</span>
                    <span className="text-red-400 opacity-50">↩</span>
                </button>

                {/* Admin Section logic could act on user.isAdmin if you have such a field */}
            </div>
        </div>
    );
}
