"use client";

import { useAuth } from "@/hooks/useAuth";
import AuthForm from "@/components/auth/AuthForm";

export default function UserTab() {
    const { user, logout } = useAuth();

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center py-8">
                <h2 className="text-xl font-bold mb-6">Anmelden</h2>
                <AuthForm />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* User Info */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 text-center">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center text-3xl text-white shadow-lg">
                    {user.email?.charAt(0).toUpperCase() || "👤"}
                </div>
                <h2 className="font-bold text-lg">{user.name || user.email}</h2>
                <p className="text-zinc-500 text-sm">{user.email}</p>
                <div className="mt-2 inline-block bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs px-3 py-1 rounded-full font-medium">
                    ID: {user.id.slice(0, 8)}...
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    <span>App-Einstellungen</span>
                    <span className="text-zinc-400">›</span>
                </button>
                <button className="w-full text-left px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    <span>Daten exportieren</span>
                    <span className="text-zinc-400">›</span>
                </button>
            </div>

            {/* Logout */}
            <button
                onClick={logout}
                className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
                Abmelden
            </button>
        </div>
    );
}
