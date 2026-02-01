"use client";

import { useState } from "react";
import LessonsTab from "@/components/study/LessonsTab";
import InfosTab from "@/components/study/InfosTab";
import QuestionsTab from "@/components/setup/QuestionsTab";
import MemoryVersesTab from "@/components/setup/MemoryVersesTab";
import LearningTestsTab from "@/components/setup/LearningTestsTab";
import { BookOpen, Lightbulb, HelpCircle, ChevronLeft, Brain, GraduationCap, Library, Languages, Quote, FileText, Palette, Ruler } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import MeasuresTab from "@/components/study/MeasuresTab";

type Tab = "lessons" | "facts" | "questions" | "memory_verses" | "learning_tests" | "content_management" | "word_studies" | "quotes" | "text_studies" | "illustrations" | "measures";

// 1. Content Management Sub-Tiles (Question editing, tests etc. within Lessons)
const contentTiles = [
    {
        id: "lessons" as Tab,
        label: "Lektionen",
        description: "Lektionen verwalten",
        icon: BookOpen,
        color: "indigo",
        gradient: "from-indigo-500 to-purple-600"
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
        id: "memory_verses" as Tab,
        label: "Lernverse",
        description: "Verse verknüpfen & Vorschläge",
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

// 2. Main Menu Tiles for Library in requested priority
const mainTiles = [
    {
        id: "content_management" as Tab,
        label: "Lektionen",
        description: "Lektionen, Fragen & Tests",
        icon: Library,
        color: "blue",
        gradient: "from-[#143473] to-[#0095a9]"
    },
    {
        id: "word_studies" as Tab,
        label: "Wortstudien",
        description: "Wortbedeutungen",
        icon: Languages,
        color: "violet",
        gradient: "from-[#143473] to-[#96124b]"
    },
    {
        id: "text_studies" as Tab,
        label: "Auslegungen",
        description: "Bibeltext-Auslegungen",
        icon: FileText,
        color: "teal",
        gradient: "from-[#0095a9] to-[#143473]"
    },
    {
        id: "facts" as Tab,
        label: "Infos",
        description: "Fakten & Hintergrund",
        icon: Lightbulb,
        color: "bordeaux",
        gradient: "from-[#96124b] to-[#0095a9]"
    },
    {
        id: "quotes" as Tab,
        label: "Zitate",
        description: "Zitate pflegen",
        icon: Quote,
        color: "bordeaux",
        gradient: "from-[#96124b] to-[#143473]"
    },
    {
        id: "illustrations" as Tab,
        label: "Illustrationen",
        description: "Bsp. & Geschichten",
        icon: Palette,
        color: "petrol",
        gradient: "from-[#0095a9] to-[#55565a]"
    },
    {
        id: "measures" as Tab,
        label: "Einheiten",
        description: "Antike Maße & Gewichte",
        icon: Ruler,
        color: "gray",
        gradient: "from-[#55565a] to-[#143473]"
    },
];

export default function LibraryPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab | null>(null);

    const getTabContent = () => {
        switch (activeTab) {
            case "lessons": return <LessonsTab />;
            case "facts": return <InfosTab />;
            case "word_studies": return <InfosTab mode="word_study" />;
            case "quotes": return <InfosTab mode="quote" />;
            case "text_studies": return <InfosTab mode="text_study" />;
            case "illustrations": return <InfosTab mode="illustration" />;
            case "questions": return <QuestionsTab />;
            case "memory_verses": return <MemoryVersesTab />;
            case "learning_tests": return <LearningTestsTab />;
            case "measures": return <MeasuresTab />;
            default: return null;
        }
    };

    const activeTile = contentTiles.find(t => t.id === activeTab) || mainTiles.find(t => t.id === activeTab);
    const isSubMenu = activeTab === "content_management";

    const handleBack = () => {
        if (contentTiles.some(t => t.id === activeTab)) {
            setActiveTab("content_management");
        } else {
            setActiveTab(null);
        }
    };

    const renderGrid = (tiles: any[]) => (
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {tiles.map(tile => {
                const Icon = tile.icon;
                return (
                    <button
                        key={tile.id}
                        onClick={() => setActiveTab(tile.id)}
                        className="relative group bg-white dark:bg-slate-800 rounded-3xl border border-zinc-100 dark:border-slate-700 p-5 text-left transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 active:scale-95 overflow-hidden flex flex-col justify-start h-full"
                    >
                        {/* Gradient Background on Hover */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${tile.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`} />

                        {/* Icon Container */}
                        <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${tile.gradient} flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/10 group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>

                        {/* Title */}
                        <h3 className="relative font-heading font-black text-zinc-900 dark:text-white mb-1.5 leading-tight tracking-tight uppercase text-sm sm:text-base">
                            {tile.label}
                        </h3>

                        {/* Description */}
                        <p className="relative text-[10px] sm:text-xs font-medium text-zinc-400 dark:text-zinc-500 line-clamp-2 leading-relaxed">
                            {tile.description}
                        </p>
                    </button>
                );
            })}
        </div>
    );

    if (!activeTab) {
        return (
            <div className="min-h-[100dvh] pb-32">
                {/* Modern Header with Safe Area Support */}
                <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-4 border-b border-zinc-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl shadow-sm">
                            <Library className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-heading font-black tracking-tight text-zinc-900 dark:text-white">Bibliothek</h1>
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Inhalte verwalten</p>
                        </div>
                    </div>
                </header>

                <div className="p-6">
                    {renderGrid(mainTiles)}
                </div>
            </div>
        );
    }

    if (isSubMenu) {
        return (
            <div className="min-h-[100dvh] pb-32">
                <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-3 border-b border-zinc-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBack}
                            className="p-2.5 rounded-xl bg-zinc-100 dark:bg-slate-800 text-zinc-600 dark:text-zinc-400 hover:scale-95 active:scale-90 transition-all"
                            title="Zurück"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeTile?.gradient} flex items-center justify-center shadow-lg shadow-indigo-500/20`}>
                                <Library className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-heading font-bold text-zinc-900 dark:text-white">Lektionen</h1>
                                <p className="text-xs font-medium text-zinc-500">Inhalte bearbeiten</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-6">
                    {renderGrid(contentTiles)}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] pb-24 bg-zinc-50 dark:bg-slate-900">
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl pt-[calc(1rem+env(safe-area-inset-top))] border-b border-zinc-100 dark:border-slate-800 shadow-sm transition-all">
                <div className="flex items-center gap-3 px-4 py-3">
                    <button
                        onClick={handleBack}
                        className="p-2.5 rounded-xl bg-zinc-100 dark:bg-slate-800 text-zinc-600 dark:text-zinc-400 active:scale-90 transition-all"
                        title="Zurück"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-3">
                        {activeTile && (
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeTile.gradient} flex items-center justify-center shadow-lg`}>
                                <activeTile.icon className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-lg font-heading font-black tracking-tight text-zinc-900 dark:text-white uppercase">{activeTile?.label}</h1>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{activeTile?.description}</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="w-full">
                {getTabContent()}
            </div>
        </div>
    );
}
