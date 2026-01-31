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
import GroupsTab from "@/components/setup/GroupsTab";
import { BookOpen, Lightbulb, HelpCircle, User, Ruler, ChevronLeft, Palette, Settings, Brain, GraduationCap, Users, Library, Languages, Quote } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Tab = "lessons" | "facts" | "measures" | "questions" | "user" | "design" | "memory_verses" | "learning_tests" | "groups" | "content_management" | "word_studies" | "quotes";

// 1. Content Management Sub-Tiles
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
        id: "facts" as Tab,
        label: "Infos",
        description: "Fakten & Hintergrund",
        icon: Lightbulb,
        color: "amber",
        gradient: "from-amber-400 to-orange-500"
    },
    {
        id: "quotes" as Tab,
        label: "Zitate",
        description: "Zitate pflegen",
        icon: Quote,
        color: "rose",
        gradient: "from-rose-500 to-pink-600"
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

// 2. Main Menu Tiles
const mainTiles = [
    {
        id: "content_management" as Tab,
        label: "Lektionen",
        description: "Lektionen, Fragen & Tests",
        icon: Library,
        color: "sky",
        gradient: "from-sky-500 to-blue-600"
    },
    {
        id: "measures" as Tab,
        label: "Einheiten",
        description: "Antike Maße & Gewichte",
        icon: Ruler,
        color: "cyan",
        gradient: "from-cyan-500 to-teal-600"
    },
    {
        id: "word_studies" as Tab,
        label: "Wortstudien",
        description: "Wortbedeutungen",
        icon: Languages,
        color: "violet",
        gradient: "from-violet-500 to-purple-600"
    },
    {
        id: "groups" as Tab,
        label: "Gruppen",
        description: "Gruppenverwaltung & Import",
        icon: Users,
        color: "amber",
        gradient: "from-amber-400 to-orange-500"
    },
    {
        id: "user" as Tab,
        label: "Benutzer",
        description: "Profil, Design & Einstellungen",
        icon: User,
        color: "purple",
        gradient: "from-purple-500 to-pink-600"
    },
];

export default function SetupPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab | null>(null);

    const getTabContent = () => {
        switch (activeTab) {
            case "lessons": return <LessonsTab />;
            case "facts": return <InfosTab />;
            case "word_studies": return <InfosTab mode="word_study" />;
            case "quotes": return <InfosTab mode="quote" />;
            case "measures": return <MeasuresTab />;
            case "questions": return <QuestionsTab />;
            case "user": return <UserTab />;
            case "design": return <DesignTab />;
            case "memory_verses": return <MemoryVersesTab />;
            case "learning_tests": return <LearningTestsTab />;
            case "groups": return <GroupsTab />;
            default: return null;
        }
    };

    const activeTile = contentTiles.find(t => t.id === activeTab) || mainTiles.find(t => t.id === activeTab);
    const isSubMenu = activeTab === "content_management";

    const handleBack = () => {
        // If currently in a content tile, go back to content management
        if (contentTiles.some(t => t.id === activeTab)) {
            setActiveTab("content_management");
        } else {
            // Otherwise (Main menu or already in content management) go to root
            setActiveTab(null);
        }
    };

    const renderGrid = (tiles: any[]) => (
        <div className="grid grid-cols-2 gap-4">
            {tiles.map(tile => {
                const Icon = tile.icon;
                return (
                    <button
                        key={tile.id}
                        onClick={() => setActiveTab(tile.id)}
                        className="relative group bg-white dark:bg-slate-700 rounded-2xl border border-zinc-200 dark:border-slate-600 p-4 text-left transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-transparent overflow-hidden flex flex-col justify-start h-full"
                    >
                        {/* Gradient Background on Hover */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${tile.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                        {/* Icon Container */}
                        <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${tile.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>

                        {/* Title */}
                        <h3 className="relative font-heading font-bold text-zinc-900 dark:text-white mb-1">
                            {tile.label}
                        </h3>

                        {/* Description */}
                        <p className="relative text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                            {tile.description}
                        </p>
                    </button>
                );
            })}
        </div>
    );

    // Show Main Menu (Root)
    if (!activeTab) {
        return (
            <div className="min-h-screen pb-24">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-background/80 dark:bg-slate-800/90 backdrop-blur-xl px-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 dark:bg-slate-700 rounded-lg">
                            <Settings className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-heading font-bold">Einstellungen</h1>
                            <p className="text-sm text-zinc-500">Wähle einen Bereich</p>
                        </div>
                    </div>
                </header>

                {/* Main Grid */}
                < div className="p-4" >
                    {
                        renderGrid(mainTiles.filter(tile => {
                            if (user?.is_admin) return true;
                            // Hide Lektionen and Gruppen for non-admins
                            return !["content_management", "groups"].includes(tile.id);
                        }))
                    }
                </div >
            </div >
        );
    }

    // Show Content Management Sub-Menu
    if (isSubMenu) {
        return (
            <div className="min-h-screen pb-24">
                <header className="sticky top-0 z-40 bg-background/80 dark:bg-slate-800/90 backdrop-blur-xl px-4 py-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBack}
                            className="p-2 -ml-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-700 transition-colors"
                            title="Zurück"
                        >
                            <ChevronLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${activeTile?.gradient} flex items-center justify-center`}>
                                <Library className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-heading font-bold">Lektionen</h1>
                                <p className="text-xs text-zinc-500">Inhalte bearbeiten</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-4">
                    {renderGrid(contentTiles)}
                </div>
            </div>
        );
    }

    // Show Active Tab Content
    return (
        <div className="min-h-screen pb-24">
            {/* Header with Back Button */}
            <header className="sticky top-0 z-40 bg-background">
                <div className="flex items-center gap-3 px-4 py-4">
                    <button
                        onClick={handleBack}
                        className="p-2 -ml-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-700 transition-colors"
                        title="Zurück"
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
                            <h1 className="text-lg font-heading font-bold">{activeTile?.label}</h1>
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
