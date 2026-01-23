import InstallPrompt from "@/components/pwa/InstallPrompt";
import Link from 'next/link';
import { BookOpen, MessageCircleQuestion, Bookmark, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
    return (
        <div className="min-h-screen pb-24">
            {/* Hero Section with Gradient */}
            <header className="relative overflow-hidden px-5 pt-8 pb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 opacity-90" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />

                <div className="relative z-10">
                    <p className="text-indigo-200 text-sm font-medium mb-1">Willkommen zurück</p>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Guten Tag! 👋</h1>
                </div>
            </header>

            {/* Verse of the Day Card */}
            <section className="px-4 -mt-2 relative z-20">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-indigo-500/10 p-5 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-soft" />
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            Vers des Tages
                        </span>
                    </div>
                    <p className="verse-text text-lg text-zinc-800 dark:text-zinc-100 mb-3">
                        „Trachtet zuerst nach dem Reich Gottes und nach seiner Gerechtigkeit, so wird euch das alles zufallen."
                    </p>
                    <p className="text-right text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        Matthäus 6,33
                    </p>
                </div>
            </section>

            {/* Quick Stats */}
            <section className="px-4 mt-6">
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/30">
                        <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-1" />
                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">7</p>
                        <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-medium">Tage Streak</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800/30">
                        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-1" />
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">12</p>
                        <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 font-medium">Kapitel</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-xl p-3 border border-purple-100 dark:border-purple-800/30">
                        <Bookmark className="w-5 h-5 text-purple-600 dark:text-purple-400 mb-1" />
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">5</p>
                        <p className="text-[10px] text-purple-600/70 dark:text-purple-400/70 font-medium">Notizen</p>
                    </div>
                </div>
            </section>

            {/* Quick Actions */}
            <section className="px-4 mt-6 space-y-3">
                <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Schnellzugriff</h3>

                <Link
                    href="/bible"
                    className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
                >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-zinc-900 dark:text-white">Weiterlesen</p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">1. Mose Kapitel 3</p>
                    </div>
                    <span className="text-zinc-300 dark:text-zinc-600 group-hover:text-indigo-500 transition-colors text-xl">›</span>
                </Link>

                <Link
                    href="/questions"
                    className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
                >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <MessageCircleQuestion className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-zinc-900 dark:text-white">Frage stellen</p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">AI-gestützte Antworten</p>
                    </div>
                    <span className="text-zinc-300 dark:text-zinc-600 group-hover:text-amber-500 transition-colors text-xl">›</span>
                </Link>
            </section>

            {/* Install Prompt */}
            <section className="px-4 mt-8">
                <InstallPrompt />
            </section>
        </div>
    );
}
