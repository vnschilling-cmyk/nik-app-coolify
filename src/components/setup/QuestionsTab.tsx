"use client";

import { MessageCircleQuestion } from "lucide-react";
import Link from "next/link";

export default function QuestionsTab() {
    return (
        <div className="space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-6 border border-emerald-100 dark:border-emerald-800/30">
                <MessageCircleQuestion className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mb-3" />
                <h3 className="font-bold text-lg text-emerald-800 dark:text-emerald-200 mb-2">Fragen an AI</h3>
                <p className="text-emerald-700 dark:text-emerald-300 text-sm mb-4">
                    Stelle Fragen zur Bibel und erhalte AI-gestützte Antworten basierend auf dem Bibeltext.
                </p>
                <Link
                    href="/questions"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                    Zur Fragen-Seite →
                </Link>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
                <h4 className="font-semibold mb-2">Hinweis</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Die Fragen-Funktion nutzt den Google AI Key aus deinen Einstellungen, um intelligente Antworten zu generieren.
                </p>
            </div>
        </div>
    );
}
