"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { Plus, Trash2, BookOpen, Sparkles, X, ChevronDown, ChevronRight, GraduationCap, Check, Pencil } from "lucide-react";

interface BibleBook {
    id: string;
    name: string;
    chapters: number;
    order: number;
}

interface Lesson {
    id: string;
    title: string;
    category: string;
    content: string;
    book_id?: string;
}

interface MemoryVerse {
    id: string;
    lesson_id: string;
    book_id: string;
    chapter: number;
    verse_start: number;
    verse_end: number;
    text: string;
    translation: string;
    expand?: {
        book_id: { name: string };
        lesson_id: { title: string };
    };
}

interface Suggestion {
    book: string;
    chapter: number;
    verse_start: number;
    verse_end: number;
    text: string;
    reason: string;
}

export default function MemoryVersesTab() {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [verses, setVerses] = useState<MemoryVerse[]>([]);
    const [books, setBooks] = useState<BibleBook[]>([]);
    const [loading, setLoading] = useState(true);

    // Create/Edit State
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingVerseId, setEditingVerseId] = useState<string | null>(null);

    const [mode, setMode] = useState<"manual" | "ai">("manual");
    const [selectedLessonId, setSelectedLessonId] = useState("");

    // Expanded State
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    // Form State
    const [formBookId, setFormBookId] = useState("");
    const [formChapter, setFormChapter] = useState(1);
    const [formVerseStart, setFormVerseStart] = useState(1);
    const [formVerseEnd, setFormVerseEnd] = useState(1);
    const [formText, setFormText] = useState("");

    // AI State
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [lessonsRes, versesRes, booksRes] = await Promise.all([
                pb.collection('lessons').getFullList({ sort: 'title' }),
                pb.collection('memory_verses').getFullList({ sort: 'created', expand: 'book_id,lesson_id' }),
                pb.collection('bible_books').getFullList({ sort: 'order' })
            ]);
            setLessons(lessonsRes.map(r => ({ id: r.id, title: r.title, category: r.category, content: r.content, book_id: r.book_id })));
            setVerses(versesRes as any[]);
            setBooks(booksRes.map(r => ({ id: r.id, name: r.name, chapters: r.chapter_count || 50, order: r.order })));
        } catch (e) {
            console.error("Load error:", e);
        } finally {
            setLoading(false);
        }
    };

    const toggleGroup = (id: string) => {
        const newSet = new Set(expandedGroups);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedGroups(newSet);
    };

    const getSuggestions = async () => {
        if (!selectedLessonId) return;
        setLoadingSuggestions(true);
        setSuggestions([]);

        try {
            const lesson = lessons.find(l => l.id === selectedLessonId);
            if (!lesson) return;

            const res = await fetch('/api/suggest-verses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: lesson.title,
                    category: lesson.category,
                    content: lesson.content
                })
            });

            if (!res.ok) throw new Error("API Error");

            const data = await res.json();
            if (Array.isArray(data)) {
                setSuggestions(data);
            }
        } catch (e) {
            console.error(e);
            alert("Fehler beim Laden der Vorschläge");
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const handleManualSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!selectedLessonId || !formBookId || !formText) return;

        try {
            const data = {
                lesson_id: selectedLessonId,
                book_id: formBookId,
                chapter: formChapter,
                verse_start: formVerseStart,
                verse_end: formVerseEnd,
                text: formText,
                translation: 'SCH2000'
            };

            if (isEditing && editingVerseId) {
                await pb.collection('memory_verses').update(editingVerseId, data);
            } else {
                await pb.collection('memory_verses').create(data);
            }

            resetForm();
            loadData();
            setIsCreating(false);
        } catch (e: any) {
            alert("Fehler: " + e.message);
        }
    };

    const addSuggestion = (s: Suggestion) => {
        const book = books.find(b => b.name.toLowerCase().includes(s.book.toLowerCase()) || s.book.toLowerCase().includes(b.name.toLowerCase()));

        if (!book) {
            alert(`Konnte Buch "${s.book}" nicht finden. Bitte manuell anlegen.`);
            return;
        }

        setFormBookId(book.id);
        setFormChapter(s.chapter);
        setFormVerseStart(s.verse_start);
        setFormVerseEnd(s.verse_end);
        setFormText(s.text);
        setMode("manual");
    };

    const editVerse = (v: MemoryVerse) => {
        setEditingVerseId(v.id);
        setIsEditing(true);
        setSelectedLessonId(v.lesson_id);
        setFormBookId(v.book_id);
        setFormChapter(v.chapter);
        setFormVerseStart(v.verse_start);
        setFormVerseEnd(v.verse_end);
        setFormText(v.text);
        setMode("manual");
        setIsCreating(true);
    };

    const deleteVerse = async (id: string) => {
        if (!confirm("Löschen?")) return;
        try {
            await pb.collection('memory_verses').delete(id);
            loadData();
        } catch (e: any) {
            alert("Fehler: " + e.message);
        }
    };

    const resetForm = () => {
        // Keep selectedLessonId if editing? No, logic above might need review but let's clear it for now to be safe or set default.
        // Actually, if we just cancel edit, maybe we want to keep it? Let's reset everything for "Clean Slate".
        setSelectedLessonId("");
        setFormBookId("");
        setFormChapter(1);
        setFormVerseStart(1);
        setFormVerseEnd(1);
        setFormText("");
        setSuggestions([]);
        setMode("manual");
        setIsEditing(false);
        setEditingVerseId(null);
    };

    const selectedBook = books.find(b => b.id === formBookId);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold dark:text-white">Lernverse</h2>
                {!isCreating && (
                    <button
                        onClick={() => { resetForm(); setIsCreating(true); }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} /> Neuer Vers
                    </button>
                )}
            </div>

            {isCreating ? (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 animate-fadeIn">
                    <div className="flex justify-between mb-6">
                        <h3 className="text-lg font-bold">{isEditing ? "Vers bearbeiten" : "Neuen Vers erstellen"}</h3>
                        <button onClick={() => { setIsCreating(false); resetForm(); }} className="text-zinc-400 hover:text-zinc-600">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-1">Lektion *</label>
                        <select
                            value={selectedLessonId}
                            onChange={e => setSelectedLessonId(e.target.value)}
                            className="w-full p-2 rounded-lg border dark:bg-zinc-800 dark:border-zinc-700"
                        >
                            <option value="">Bitte wählen...</option>
                            {lessons.map(l => (
                                <option key={l.id} value={l.id}>{l.title}</option>
                            ))}
                        </select>
                    </div>

                    {!isEditing && (
                        <div className="flex gap-4 mb-6">
                            <button
                                onClick={() => setMode("manual")}
                                className={`flex-1 py-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${mode === "manual" ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" : "border-zinc-200 dark:border-zinc-800 text-zinc-400"}`}
                            >
                                <Plus size={20} /> Manuell erstellen
                            </button>
                            <button
                                onClick={() => setMode("ai")}
                                className={`flex-1 py-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${mode === "ai" ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600" : "border-zinc-200 dark:border-zinc-800 text-zinc-400"}`}
                            >
                                <Sparkles size={20} /> Mit AI generieren
                            </button>
                        </div>
                    )}

                    {mode === "ai" && (
                        <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-800 mb-6">
                            <div className="text-center">
                                <button
                                    onClick={getSuggestions}
                                    disabled={loadingSuggestions || !selectedLessonId}
                                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loadingSuggestions ? <span className="animate-pulse">Generiere...</span> : "Vorschläge generieren ✨"}
                                </button>
                            </div>

                            {suggestions.length > 0 && (
                                <div className="mt-6 space-y-3">
                                    {suggestions.map((s, idx) => (
                                        <div key={idx} className="bg-white dark:bg-zinc-800 p-4 rounded-lg border border-purple-100 dark:border-purple-900 flex justify-between items-start gap-4">
                                            <div>
                                                <h4 className="font-bold text-indigo-600 dark:text-indigo-400">
                                                    {s.book} {s.chapter}:{s.verse_start}{s.verse_end > s.verse_start && `-${s.verse_end}`}
                                                </h4>
                                                <p className="text-sm text-zinc-600 dark:text-zinc-300 italic my-1">"{s.text}"</p>
                                                <p className="text-xs text-zinc-400">💡 {s.reason}</p>
                                            </div>
                                            <button
                                                onClick={() => addSuggestion(s)}
                                                className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                                                title="Übernehmen & Bearbeiten"
                                            >
                                                <Check size={20} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {mode === "manual" && (
                        <div className="space-y-4 mb-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Buch</label>
                                    <select
                                        value={formBookId}
                                        onChange={e => { setFormBookId(e.target.value); setFormChapter(1); }}
                                        className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
                                    >
                                        <option value="">Wählen...</option>
                                        {books.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Kapitel</label>
                                    <select
                                        value={formChapter}
                                        onChange={e => setFormChapter(parseInt(e.target.value))}
                                        className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
                                        disabled={!formBookId}
                                    >
                                        {selectedBook ? Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(n => (
                                            <option key={n} value={n}>{n}</option>
                                        )) : <option>-</option>}
                                    </select>
                                </div>
                                <div className="col-span-2 sm:col-span-2">
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Verse</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="number" min="1"
                                            value={formVerseStart}
                                            onChange={e => setFormVerseStart(parseInt(e.target.value))}
                                            className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
                                            placeholder="Start"
                                        />
                                        <span>-</span>
                                        <input
                                            type="number" min="1"
                                            value={formVerseEnd}
                                            onChange={e => setFormVerseEnd(parseInt(e.target.value))}
                                            className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
                                            placeholder="Ende"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Text</label>
                                <textarea
                                    value={formText}
                                    onChange={e => setFormText(e.target.value)}
                                    placeholder="Vers Text eingeben..."
                                    className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm min-h-[80px]"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            onClick={handleManualSubmit}
                            disabled={!selectedLessonId || !formBookId || !formText}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isEditing ? "Änderungen speichern" : "Vers Speichern"}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {loading ? (
                        <p className="text-center py-10 text-zinc-500">Lade Verse...</p>
                    ) : verses.length === 0 ? (
                        <p className="text-center py-10 text-zinc-500">Noch keine Verse erstellt.</p>
                    ) : (
                        (() => {
                            const versesByBook = new Map<string, {
                                id: string;
                                title: string;
                                order: number;
                                lessons: Map<string, MemoryVerse[]>;
                            }>();

                            verses.forEach(v => {
                                const lesson = lessons.find(l => l.id === v.lesson_id);
                                if (!lesson) return;

                                let bookId = "general";
                                let bookTitle = "Thematische Lektionen";
                                let bookOrder = 9999;

                                if (lesson.book_id) {
                                    const book = books.find(b => b.id === lesson.book_id);
                                    if (book) {
                                        bookId = book.id;
                                        bookTitle = book.name;
                                        bookOrder = book.order;
                                    }
                                }

                                if (!versesByBook.has(bookId)) {
                                    versesByBook.set(bookId, { id: bookId, title: bookTitle, order: bookOrder, lessons: new Map() });
                                }

                                const bookGroup = versesByBook.get(bookId)!;
                                const lessonList = bookGroup.lessons.get(lesson.id) || [];
                                lessonList.push(v);
                                bookGroup.lessons.set(lesson.id, lessonList);
                            });

                            const sortedBooks = Array.from(versesByBook.values()).sort((a, b) => a.order - b.order);

                            return sortedBooks.map(bookGroup => {
                                const isExpanded = expandedGroups.has(bookGroup.id);
                                const totalVerses = Array.from(bookGroup.lessons.values()).flat().length;

                                return (
                                    <section key={bookGroup.id} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                                        <button
                                            onClick={() => toggleGroup(bookGroup.id)}
                                            className="w-full flex items-center justify-between p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <h3 className={`text-sm font-bold uppercase tracking-wider ${bookGroup.id !== 'general' ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-600"}`}>
                                                    {bookGroup.title}
                                                </h3>
                                                <span className="text-zinc-400 text-xs font-normal">({totalVerses})</span>
                                            </div>
                                            {isExpanded ? <ChevronDown size={20} className="text-zinc-400" /> : <ChevronRight size={20} className="text-zinc-400" />}
                                        </button>

                                        {isExpanded && (
                                            <div className="border-t border-zinc-200 dark:border-zinc-800">
                                                {Array.from(bookGroup.lessons.entries()).map(([lessonId, lessonVerses]) => {
                                                    const lesson = lessons.find(l => l.id === lessonId);
                                                    const lessonKey = `${bookGroup.id}-${lessonId}`;
                                                    const isLessonExpanded = expandedGroups.has(lessonKey);

                                                    return (
                                                        <div key={lessonId} className="border-b border-zinc-200 dark:border-zinc-800 last:border-0">
                                                            <button
                                                                onClick={() => toggleGroup(lessonKey)}
                                                                className="w-full flex items-center justify-between p-3 pl-6 hover:bg-white dark:hover:bg-zinc-900 transition-colors"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <GraduationCap size={16} className="text-fuchsia-600 dark:text-fuchsia-400" />
                                                                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                                                        {lesson?.title}
                                                                    </span>
                                                                    <span className="text-zinc-400 text-xs">({lessonVerses.length})</span>
                                                                </div>
                                                                {isLessonExpanded ? <ChevronDown size={16} className="text-zinc-400" /> : <ChevronRight size={16} className="text-zinc-400" />}
                                                            </button>

                                                            {isLessonExpanded && (
                                                                <div className="p-3 pl-8 space-y-2 bg-white dark:bg-zinc-900">
                                                                    {lessonVerses.map(v => (
                                                                        <div key={v.id} className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 flex justify-between items-center group hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors bg-zinc-50 dark:bg-zinc-800/30">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                                                                    <BookOpen size={14} className="text-indigo-600 dark:text-indigo-400" />
                                                                                </div>
                                                                                <div>
                                                                                    <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                                                                                        {v.expand?.book_id?.name || "Buch"} {v.chapter}:{v.verse_start}{v.verse_end > v.verse_start && `-${v.verse_end}`}
                                                                                    </h4>
                                                                                    <p className="text-xs text-zinc-500 truncate max-w-[200px]">{v.text}</p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); editVerse(v); }}
                                                                                    className="p-1.5 text-zinc-400 hover:text-indigo-500 transition-colors"
                                                                                >
                                                                                    <Pencil size={16} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); deleteVerse(v.id); }}
                                                                                    className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                                                                                >
                                                                                    <Trash2 size={16} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </section>
                                );
                            });
                        })()
                    )}
                </div>
            )}
        </div>
    );
}
