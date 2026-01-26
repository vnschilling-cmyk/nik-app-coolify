"use client";

import GroupsOverview from "@/components/groups/GroupsOverview";
import { Users } from "lucide-react";

export default function GroupsPage() {
    return (
        <div className="min-h-screen pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 px-4 py-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                        <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Gruppen</h1>
                        <p className="text-sm text-zinc-500">Kirchen- & Kleingruppen</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4">
                <GroupsOverview />
            </main>
        </div>
    );
}
