import InstallPrompt from "@/components/pwa/InstallPrompt";

export default function DashboardPage() {
    return (
        <div className="p-4 space-y-6">
            <header className="flex justify-between items-center py-4">
                <h1 className="text-2xl font-bold tracking-tight">Übersicht</h1>
            </header>

            <section className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800">
                <h2 className="text-sm font-semibold uppercase text-blue-600 dark:text-blue-400 mb-2">
                    Vers des Tages
                </h2>
                <p className="text-xl font-medium serif italic text-zinc-800 dark:text-zinc-100 mb-4">
                    "Trachtet zuerst nach dem Reich Gottes und nach seiner Gerechtigkeit, so wird euch das alles zufallen."
                </p>
                <p className="text-right text-sm text-zinc-500 font-medium">Matthäus 6,33</p>
            </section>

            <section className="space-y-4">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Schnellzugriff</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <span className="block text-2xl mb-1">📖</span>
                        <span className="font-medium">Weiterlesen</span>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <span className="block text-2xl mb-1">❓</span>
                        <span className="font-medium">Frage stellen</span>
                    </div>
                </div>
            </section>

            <section className="mt-8">
                <InstallPrompt />
            </section>
        </div>
    );
}
