"use client";

import { useAuth } from "@/hooks/useAuth";
import AuthForm from "@/components/auth/AuthForm";
import Link from "next/link";

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

            <div className="bg-zinc-100 dark:bg-slate-800 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center text-3xl border border-zinc-200 dark:border-slate-700">
                👤
            </div>
            <div className="text-center mb-8">
                <h2 className="font-semibold text-lg">{user.email}</h2>
                <p className="text-zinc-500 text-sm">Mitglied</p>

            </div>

            <div className="space-y-2">

                <a href="/setup" className="w-full text-left px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-lg flex justify-between items-center active:scale-[0.98] transition-transform">
                    <span className="text-indigo-700 dark:text-indigo-300">📚 Inhalte verwalten</span>
                    <span className="text-indigo-400">›</span>
                </a>


                <button
                    onClick={logout}
                    className="w-full text-left px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-lg flex justify-between items-center mt-6 active:scale-[0.98] transition-transform"
                >
                    <span>Abmelden</span>
                    <span className="text-red-400 opacity-50">↩</span>
                </button>

                <div className="flex justify-center gap-6 mt-12 pt-6 border-t border-zinc-100 dark:border-slate-700/50">
                    <Link href="/impressum" className="text-xs text-zinc-400 hover:text-indigo-500 transition-colors">
                        Impressum
                    </Link>
                    <Link href="/datenschutz" className="text-xs text-zinc-400 hover:text-indigo-500 transition-colors">
                        Datenschutz
                    </Link>
                </div>
            </div>
        </div>
    );
}
