export default function QuestionsPage() {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">Fragen & Antworten</h1>

            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm">
                        <div className="flex items-start gap-3">
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shrink-0">
                                ?
                            </span>
                            <div>
                                <h3 className="font-medium text-base mb-1">Was bedeutet "Logos" im Kontext von Johannes 1?</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                                    Der Begriff Logos hat eine tiefe philosophische und theologische Bedeutung in der Antike...
                                </p>
                                <div className="mt-3 flex gap-2">
                                    <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-600 dark:text-zinc-400">Theologie</span>
                                    <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-600 dark:text-zinc-400">Johannes</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
