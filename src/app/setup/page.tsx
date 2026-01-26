"use client";

import { useState } from "react";
import LessonsTab from "@/components/study/LessonsTab";
import InfosTab from "@/components/study/InfosTab";
import MeasuresTab from "@/components/study/MeasuresTab";
import QuestionsTab from "@/components/setup/QuestionsTab";
import UserTab from "@/components/setup/UserTab";
import DesignTab from "@/components/setup/DesignTab";
import MemoryVersesTab from "@/components/setup/MemoryVersesTab";
import LearningTestsTab from "@/components/setup/LearningTestsTab";
import { BookOpen, Lightbulb, HelpCircle, User, Ruler, ChevronLeft, Palette, Settings, Brain, GraduationCap } from "lucide-react";

type Tab = "lessons" | "facts" | "measures" | "questions" | "user" | "design" | "memory_verses" | "learning_tests";

const tiles = [
    {
        id: "lessons" as Tab,
        label: "Lektionen",
        description: "Lektionen verwalten",
        icon: BookOpen,
        color: "indigo",
        gradient: "from-indigo-500 to-purple-600"
    },
    {
        id: "facts" as Tab,
        label: "Infos",
        description: "Fakten & Hintergrund",
        icon: Lightbulb,
        color: "amber",
        gradient: "from-amber-400 to-orange-500"
    },
    {
        id: "measures" as Tab,
        label: "Maße & Gewichte",
        description: "Antike Einheiten",
        icon: Ruler,
        color: "cyan",
        gradient: "from-cyan-500 to-teal-600"
    },
    {
        id: "questions" as Tab,
        label: "Fragen",
        description: "Quizfragen bearbeiten",
        icon: HelpCircle,
        color: "emerald",
        gradient: "from-emerald-500 to-green-600"
    },
    {
        id: "user" as Tab,
        label: "Benutzer",
        description: "Profil & Einstellungen",
        icon: User,
        color: "purple",
        gradient: "from-purple-500 to-pink-600"
    },
    {
        id: "design" as Tab,
        label: "Design",
        description: "Schrift & Farben",
        icon: Palette,
        color: "pink",
        gradient: "from-pink-500 to-rose-600"
    },
    {
        id: "memory_verses" as Tab,
        label: "Lernverse",
        description: "Verse verknüpfen & AI",
        icon: Brain,
        color: "blue",
        gradient: "from-blue-500 to-cyan-600"
    },
    {
        id: "learning_tests" as Tab,
        label: "Lerntests",
        description: "Tests erstellen & verwalten",
        icon: GraduationCap,
        color: "fuchsia",
        gradient: "from-fuchsia-500 to-purple-600"
    },
];

export default function SetupPage() {
    const [activeTab, setActiveTab] = useState<Tab | null>(null);

    const getTabContent = () => {
        switch (activeTab) {
            case "lessons": return <LessonsTab />;
            case "facts": return <InfosTab />;
            case "measures": return <MeasuresTab />;
            case "questions": return <QuestionsTab />;
            case "user": return <UserTab />;
            case "design": return <DesignTab />;
            case "memory_verses": return <MemoryVersesTab />;
            case "learning_tests": return <LearningTestsTab />;
            default: return null;
        }
    };

    const activeTile = tiles.find(t => t.id === activeTab);

    // Show tile grid when no tab is active
    if (!activeTab) {
        return (
            <div className="min-h-screen pb-24">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 px-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                            <Settings className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Einstellungen</h1>
                            <p className="text-sm text-zinc-500">Wähle einen Bereich</p>
                        </div>
                    </div>
                </header>

                {/* Tile Grid */}
                <div className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                        {tiles.map(tile => {
                            const Icon = tile.icon;
                            return (
                                <button
                                    key={tile.id}
                                    onClick={() => setActiveTab(tile.id)}
                                    className="relative group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 text-left transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-transparent overflow-hidden"
                                >
                                    {/* Gradient Background on Hover */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${tile.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                                    {/* Icon Container */}
                                    <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${tile.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>

                                    {/* Title */}
                                    <h3 className="relative font-bold text-zinc-900 dark:text-white mb-1">
                                        {tile.label}
                                    </h3>

                                    {/* Description */}
                                    <p className="relative text-xs text-zinc-500 dark:text-zinc-400">
                                        {tile.description}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // Show active tab content with back button
    return (
        <div className="min-h-screen pb-24">
            {/* Header with Back Button */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50">
                <div className="flex items-center gap-3 px-4 py-4">
                    <button
                        onClick={() => setActiveTab(null)}
                        className="p-2 -ml-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                    </button>
                    <div className="flex items-center gap-3">
                        {activeTile && (
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${activeTile.gradient} flex items-center justify-center`}>
                                <activeTile.icon className="w-4 h-4 text-white" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-lg font-bold">{activeTile?.label}</h1>
                            <p className="text-xs text-zinc-500">{activeTile?.description}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tab Content */}
            <div className="p-4">
                {getTabContent()}
            </div>
        </div>
    );
}
