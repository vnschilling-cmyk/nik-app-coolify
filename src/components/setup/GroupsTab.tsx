"use client";

import { useState } from "react";
import GroupsOverview from "@/components/groups/GroupsOverview";
import CsvImportView from "@/components/groups/CsvImportView";
import ManualCreationView from "@/components/groups/ManualCreationView";
import GroupsList from "@/components/groups/GroupsList";
import { Users, FileSpreadsheet, Plus, ArrowLeft, Settings, List } from "lucide-react";

type View = "root" | "list" | "manage" | "churchtools" | "csv" | "manual";

export default function GroupsTab() {
    const [view, setView] = useState<View>("root");

    const renderRootView = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Gruppen</h2>
                <p className="text-zinc-500">Wähle einen Bereich.</p>
            </div>

            <div className="grid gap-4">
                <button
                    onClick={() => setView("list")}
                    className="p-6 bg-white dark:bg-slate-700 rounded-2xl border border-zinc-200 dark:border-slate-600 text-left hover:shadow-lg hover:border-blue-500 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <List className="text-blue-600 dark:text-blue-400" size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Angelegte Gruppen</h3>
                            <p className="text-sm text-zinc-500">Übersicht aller deiner Gruppen.</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => setView("manage")}
                    className="p-6 bg-white dark:bg-slate-700 rounded-2xl border border-zinc-200 dark:border-slate-600 text-left hover:shadow-lg hover:border-indigo-500 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Settings className="text-indigo-600 dark:text-indigo-400" size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Gruppen verwalten</h3>
                            <p className="text-sm text-zinc-500">Gruppen erstellen, importieren & synchronisieren.</p>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );

    const renderManageView = () => (
        <div className="space-y-6 animate-fadeIn">
            {renderHeader("Gruppen verwalten", "root")}

            <div className="text-center mb-6">
                <p className="text-zinc-500">Wähle eine Methode.</p>
            </div>

            <div className="grid gap-4">
                <button
                    onClick={() => setView("churchtools")}
                    className="p-6 bg-white dark:bg-slate-700 rounded-2xl border border-zinc-200 dark:border-slate-600 text-left hover:shadow-lg hover:border-indigo-500 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Users className="text-indigo-600 dark:text-indigo-400" size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">ChurchTools</h3>
                            <p className="text-sm text-zinc-500">Synchronisiere Gruppen direkt aus ChurchTools.</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => setView("csv")}
                    className="p-6 bg-white dark:bg-slate-700 rounded-2xl border border-zinc-200 dark:border-slate-600 text-left hover:shadow-lg hover:border-emerald-500 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FileSpreadsheet className="text-emerald-600 dark:text-emerald-400" size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">CSV Import</h3>
                            <p className="text-sm text-zinc-500">Erstelle Gruppen und Mitglieder per CSV-Datei.</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => setView("manual")}
                    className="p-6 bg-white dark:bg-slate-700 rounded-2xl border border-zinc-200 dark:border-slate-600 text-left hover:shadow-lg hover:border-pink-500 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus className="text-pink-600 dark:text-pink-400" size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-1 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">Manuell erstellen</h3>
                            <p className="text-sm text-zinc-500">Lege Gruppen und Mitglieder einzeln an.</p>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );

    const renderHeader = (title: string, backTo: View) => (
        <div className="flex items-center gap-4 mb-6">
            <button
                onClick={() => setView(backTo)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
                <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-bold">{title}</h2>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto">
            {view === "root" && renderRootView()}

            {view === "list" && (
                <div className="animate-slideIn">
                    {renderHeader("Angelegte Gruppen", "root")}
                    <GroupsList />
                </div>
            )}

            {view === "manage" && renderManageView()}

            {view === "churchtools" && (
                <div className="animate-slideIn">
                    {renderHeader("ChurchTools", "manage")}
                    <GroupsOverview />
                </div>
            )}

            {view === "csv" && (
                <div className="animate-slideIn">
                    {renderHeader("CSV Import", "manage")}
                    <CsvImportView />
                </div>
            )}

            {view === "manual" && (
                <div className="animate-slideIn">
                    {renderHeader("Manuell erstellen", "manage")}
                    <ManualCreationView />
                </div>
            )}
        </div>
    );
}
