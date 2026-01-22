export default function ProfilePage() {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">Mein Profil</h1>

            <div className="bg-zinc-100 dark:bg-zinc-900 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center text-2xl">
                👤
            </div>
            <div className="text-center mb-8">
                <h2 className="font-semibold text-lg">Gastbenutzer</h2>
                <p className="text-zinc-500 text-sm">Nicht angemeldet</p>
            </div>

            <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex justify-between items-center">
                    <span>Einstellungen</span>
                    <span className="text-zinc-400">›</span>
                </button>
                <button className="w-full text-left px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex justify-between items-center">
                    <span>Notizen exportieren</span>
                    <span className="text-zinc-400">›</span>
                </button>
                <button className="w-full text-left px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-lg flex justify-between items-center mt-6">
                    <span>Abmelden</span>
                </button>

                {/* Admin Section Placeholder */}
                <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
                    <button className="w-full text-center py-2 text-sm text-zinc-400">
                        Admin-Bereich
                    </button>
                </div>
            </div>
        </div>
    );
}
