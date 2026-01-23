"use client";

import { useState } from "react";
import clsx from "clsx";
import LessonsTab from "@/components/study/LessonsTab";
import FactsTab from "@/components/study/FactsTab";
import QuestionsTab from "@/components/setup/QuestionsTab";
import UserTab from "@/components/setup/UserTab";
import { BookOpen, Lightbulb, MessageCircleQuestion, User } from "lucide-react";

type Tab = "lessons" | "facts" | "questions" | "user";

const tabs = [
    { id: "lessons" as Tab, label: "Lektionen", icon: BookOpen, color: "indigo" },
    { id: "facts" as Tab, label: "Fakten", icon: Lightbulb, color: "amber" },
    { id: "questions" as Tab, label: "Fragen", icon: MessageCircleQuestion, color: "emerald" },
    { id: "user" as Tab, label: "Benutzer", icon: User, color: "purple" },
];

export default function SetupPage() {
    const [activeTab, setActiveTab] = useState<Tab>("lessons");

    const getTabContent = () => {
        switch (activeTab) {
            case "lessons": return <LessonsTab />;
            case "facts": return <FactsTab />;
            case "questions": return <QuestionsTab />;
            case "user": return <UserTab />;
        }
    };

    return (
        <div className="min-h-screen pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50">
                <h1 className="text-xl font-bold px-4 py-4">⚙️ Einstellungen</h1>

                {/* Tabs - Scrollable */}
                <div className="flex overflow-x-auto px-2 -mb-px gap-1 no-scrollbar">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        // Static color mapping for Tailwind to detect classes
                        const colorClasses = {
                            indigo: isActive
                                ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-b-2 border-indigo-500"
                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
                            amber: isActive
                                ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-b-2 border-amber-500"
                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
                            emerald: isActive
                                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-b-2 border-emerald-500"
                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
                            purple: isActive
                                ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-b-2 border-purple-500"
                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
                        };

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all whitespace-nowrap",
                                    // @ts-ignore
                                    colorClasses[tab.color]
                                )}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </header>

            {/* Tab Content */}
            <div className="p-4">
                {getTabContent()}
            </div>
        </div>
    );
}
