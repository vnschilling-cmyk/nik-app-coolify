"use client";

import { useAuth } from "@/hooks/useAuth";
import AuthForm from "@/components/auth/AuthForm";
import DesignTab from "./DesignTab";
import { Palette } from "lucide-react";

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
        <div className="space-y-8">
            {/* User Info */}
            <div className="bg-white dark:bg-slate-700 rounded-2xl p-6 border border-zinc-200 dark:border-slate-600 text-center">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center text-3xl text-white shadow-lg">
                    {user.email?.charAt(0).toUpperCase() || "👤"}
                </div>
                <h2 className="font-bold text-lg">{user.name || user.email}</h2>
                <p className="text-zinc-500 text-sm mb-4">{user.email}</p>

                {/* Logout Button inside the profile card for better grouping */}
                <button
                    onClick={logout}
                    className="w-full px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-xl text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                    Abmelden
                </button>
            </div>

            {/* Divider & Header for Design */}
            <div className="pt-4 border-t border-zinc-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-6 px-1">
                    <div className="p-1.5 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600 dark:text-pink-400">
                        <Palette size={18} />
                    </div>
                    <h3 className="font-bold text-zinc-900 dark:text-white">Design & Stil</h3>
                </div>

                <DesignTab />
            </div>
        </div>
    );
}
