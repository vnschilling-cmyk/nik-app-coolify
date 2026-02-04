"use client";

import { useState } from "react";
import NextImage from "next/image";
import { useAuth } from "@/hooks/useAuth";
import AuthForm from "@/components/auth/AuthForm";
import Link from "next/link";
import { User, LogOut, ShieldCheck, FileText, ChevronRight } from "lucide-react";

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
        <div className="min-h-screen pb-24">
            <header className="sticky top-0 z-40 bg-background px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Profil</h1>
                            <p className="text-sm text-zinc-500">Dein Account</p>
                        </div>
                    </div>

                </div>
            </header>

            <div className="p-4 space-y-6">

                <div className="space-y-2">

                    <a href="/setup" className="w-full text-left px-4 py-3 bg-zinc-50 dark:bg-slate-400/10 dark:backdrop-blur-md border border-zinc-200 dark:border-white/5 rounded-xl flex justify-between items-center active:scale-[0.98] transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-400/20 flex items-center justify-center">
                                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <span className="font-medium">Inhalte verwalten</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
                    </a>

                    <button
                        onClick={logout}
                        className="w-full text-left px-4 py-3 bg-zinc-50 dark:bg-slate-400/10 dark:backdrop-blur-md border border-zinc-200 dark:border-white/5 rounded-xl flex justify-between items-center mt-6 active:scale-[0.98] transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-400/20 flex items-center justify-center">
                                <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </div>
                            <span className="font-medium text-red-600 dark:text-red-400">Abmelden</span>
                        </div>
                        <LogOut className="w-4 h-4 text-red-400 opacity-50" />
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
        </div>
    );
}
