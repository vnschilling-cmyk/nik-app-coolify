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
import { BookOpen, Lightbulb, HelpCircle, User, Ruler, ChevronLeft, Palette, Settings, Brain, GraduationCap, Users, Library, Languages, Quote, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Tab = "lessons" | "facts" | "measures" | "questions" | "user" | "design" | "memory_verses" | "learning_tests" | "groups" | "content_management" | "word_studies" | "quotes" | "text_studies" | "illustrations";

// 1. Content Management Sub-Tiles (Not used in Setup anymore, but preserved type for consistency if needed)
const contentTiles: any[] = [];

// 2. Main Menu Tiles for Setup
const mainTiles = [
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
            case "user": return <UserTab />;
            case "design": return <DesignTab />;
            case "groups": return <GroupsTab />;
            default: return null;
        }
    };

    const activeTile = mainTiles.find(t => t.id === activeTab);
    const isSubMenu = false;

    const handleBack = () => {
        setActiveTab(null);
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

    // Show Main Menu (Root)
    if (!activeTab) {
        return (
            <div className="min-h-[100dvh] pb-32 bg-zinc-50 dark:bg-slate-900">
                {/* Modern Header with Safe Area Support */}
                <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-4 border-b border-zinc-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-sm">
                            <Settings className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-heading font-black tracking-tight text-zinc-900 dark:text-white">Einstellungen</h1>
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">System konfigurieren</p>
                        </div>
                    </div>
                </header>

                <div className="p-6">
                    {renderGrid(mainTiles)}
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
                        <ChevronLeft className="w-6 h-6 transition-transform group-active:-translate-x-1" />
                    </button>
                    <div className="flex items-center gap-3">
                        {activeTile && (
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeTile.gradient} flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110`}>
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
