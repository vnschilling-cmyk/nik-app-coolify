"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { Plus, Edit, Trash2, X, Save, BookOpen, ChevronDown, ChevronRight, MessageCircleQuestion, HelpCircle, Book } from "lucide-react";
import clsx from "clsx";
import RichTextEditor from "@/components/ui/RichTextEditor";

interface BibleBook {
    id: string;
    name: string;
    chapters: number;
    order: number;
}

interface Lesson {
    id: string;
    title: string;
    book_id: string;
    chapter_start: number;
    verse_start: number;
    verse_end: number;
}

interface Question {
    id: string;
    question: string;
    category: string;
    lesson_id: string;
    book_id: string;
    chapter: number;
    verse_start: number;
    verse_end: number;
    verse_ref: string;
    answer: string;
    is_answered: boolean;
    order: number;
}

const CATEGORIES = [
    { id: "bibeltext", label: "Bibeltext-Frage", icon: BookOpen, color: "indigo" },
    { id: "allgemein", label: "Allgemeine Frage", icon: HelpCircle, color: "emerald" },
];

export default function QuestionsTab() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [books, setBooks] = useState<BibleBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const [formData, setFormData] = useState({
        question: "",
        category: "bibeltext",
        lesson_id: "",
        // For general questions with Bible reference
        has_bible_ref: false,
        book_id: "",
        chapter: 1,
        verse_start: 1,
        verse_end: 1,
        answer: "",
        is_answered: false
    });

    const [maxVerses, setMaxVerses] = useState(176);

    const toggleGroup = (group: string) => {
        const newSet = new Set(expandedGroups);
        if (newSet.has(group)) {
            newSet.delete(group);
        } else {
            newSet.add(group);
        }
        setExpandedGroups(newSet);
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [questionsRes, lessonsRes, booksRes] = await Promise.all([
                pb.collection('questions').getFullList({ sort: 'question' }),
                pb.collection('lessons').getFullList({ sort: 'title' }),
                pb.collection('bible_books').getFullList({ sort: 'order' })
            ]);

            const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });
            setQuestions(questionsRes.map(r => ({
                id: r.id,
                question: r.question || "",
                category: r.category || "allgemein",
                lesson_id: r.lesson_id || "",
                book_id: r.book_id || "",
                chapter: r.chapter || 0,
                verse_start: r.verse_start || 0,
                verse_end: r.verse_end || 0,
                verse_ref: r.verse_ref || "",
                answer: r.answer || "",
                is_answered: r.is_answered || false,
                order: r.order || 0
            })).sort((a, b) => collator.compare(a.question, b.question)));

            setLessons(lessonsRes.map(r => ({
                id: r.id,
                title: r.title || "(Ohne Titel)",
                book_id: r.book_id || "",
                chapter_start: r.chapter_start ?? 1,
                verse_start: r.verse_start ?? 1,
                verse_end: r.verse_end ?? 10
            })));

            setBooks(booksRes.map(r => ({
                id: r.id,
                name: r.name,
                chapters: r.chapter_count || 50,
                order: r.order || 0
            })));
        } catch (e) {
            console.error("Failed to load data:", e);
        } finally {
            setLoading(false);
        }
    };

    // Update max verses when lesson changes (for bibeltext category)
    useEffect(() => {
        if (formData.category === "bibeltext" && formData.lesson_id) {
            const lesson = lessons.find(l => l.id === formData.lesson_id);
            if (lesson && lesson.book_id) {
                updateMaxVersesForLesson(lesson);

                // ONLY sync book/chapter if they are currently empty or if it's a NEW lesson selection
                // We check if values are currently 0 or empty to avoid overwriting manual changes 
                // like "Ganzes Buch" (chapter 0)
                setFormData(prev => {
                    if (prev.book_id === lesson.book_id && (prev.chapter === lesson.chapter_start || prev.chapter === 0)) {
                        return prev;
                    }
                    return {
                        ...prev,
                        book_id: lesson.book_id,
                        chapter: lesson.chapter_start ?? 1
                    };
                });
            }
        } else if (formData.category === "allgemein" && formData.has_bible_ref && formData.book_id && formData.chapter) {
            updateMaxVersesForBook();
        }
    }, [formData.lesson_id, formData.category, lessons]);

    const updateMaxVersesForLesson = async (lesson: Lesson) => {
        // If lesson covers whole book (chapter_start === 0), we can't fetch verses by chapter.
        // In this case, maybe we just don't limit maxVerses strictly or set a default.
        if (lesson.chapter_start === 0) {
            setMaxVerses(176); // Fallback to max PS
            return;
        }

        try {
            const record = await pb.collection('verses').getList(1, 1, {
                filter: `book="${lesson.book_id}" && chapter=${lesson.chapter_start}`,
                sort: '-verse',
                fields: 'verse'
            });
            if (record.items.length > 0) {
                setMaxVerses(record.items[0].verse);
            } else {
                setMaxVerses(lesson.verse_end || 50);
            }
        } catch (e) {
            console.error("Error fetching verse count:", e);
            setMaxVerses(lesson.verse_end || 176);
        }
    };

    const updateMaxVersesForBook = async () => {
        try {
            const record = await pb.collection('verses').getList(1, 1, {
                filter: `book="${formData.book_id}" && chapter=${formData.chapter}`,
                sort: '-verse',
                fields: 'verse'
            });
            if (record.items.length > 0) {
                setMaxVerses(record.items[0].verse);
            } else {
                setMaxVerses(50);
            }
        } catch (e) {
            console.error("Error fetching verse count:", e);
            setMaxVerses(176);
        }
    };

    const getSelectedBook = () => books.find(b => b.id === formData.book_id);

    const generateVerseRef = () => {
        if (!formData.book_id) return "";
        const book = getSelectedBook();
        if (!book) return "";

        // Check for whole book
        if (formData.chapter === 0) {
            return book.name;
        }

        // Check for whole chapter
        if (formData.verse_start === 0) {
            return `${book.name} ${formData.chapter}`;
        }

        const verseRange = formData.verse_start === formData.verse_end
            ? `${formData.verse_start}`
            : `${formData.verse_start}-${formData.verse_end}`;
        return `${book.name} ${formData.chapter}:${verseRange}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const data: any = {
            question: formData.question,
            category: formData.category,
            answer: formData.answer,
            is_answered: !!formData.answer.trim(),
            order: questions.length
        };

        if (formData.category === "bibeltext") {
            // Bibeltext questions are linked to a lesson
            data.lesson_id = formData.lesson_id;
            data.book_id = formData.book_id;
            data.chapter = formData.chapter;
            data.verse_start = (formData.chapter === 0 || formData.verse_start === 0) ? 0 : formData.verse_start;
            data.verse_end = (formData.chapter === 0 || formData.verse_start === 0) ? 0 : formData.verse_end;
            data.verse_ref = generateVerseRef();
        } else {
            // General questions - lesson is optional, but can have Bible reference
            data.lesson_id = formData.lesson_id || "";

            if (formData.has_bible_ref && formData.book_id) {
                data.book_id = formData.book_id;
                data.chapter = formData.chapter;
                data.verse_start = (formData.chapter === 0 || formData.verse_start === 0) ? 0 : formData.verse_start;
                data.verse_end = (formData.chapter === 0 || formData.verse_start === 0) ? 0 : formData.verse_end;
                data.verse_ref = generateVerseRef();
            } else {
                data.book_id = "";
                data.chapter = 0;
                data.verse_start = 0;
                data.verse_end = 0;
                data.verse_ref = "";
            }
        }

        try {
            if (editingId) {
                await pb.collection('questions').update(editingId, data);
            } else {
                await pb.collection('questions').create(data);
            }
            resetForm();
            loadData();
        } catch (e: any) {
            console.error("Save error:", e);
            alert("Fehler beim Speichern: " + e.message);
        }
    };

    const resetForm = () => {
        setFormData({
            question: "",
            category: "bibeltext",
            lesson_id: "",
            has_bible_ref: false,
            book_id: "",
            chapter: 1,
            verse_start: 1,
            verse_end: 1,
            answer: "",
            is_answered: false
        });
        setShowForm(false);
        setEditingId(null);
    };

    const handleEdit = (q: Question) => {
        setFormData({
            question: q.question,
            category: q.category,
            lesson_id: q.lesson_id,
            has_bible_ref: !!q.book_id,
            book_id: q.book_id || "",
            chapter: q.chapter,
            verse_start: q.verse_start ?? 1,
            verse_end: q.verse_end ?? 1,
            answer: q.answer,
            is_answered: q.is_answered
        });
        setEditingId(q.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Frage wirklich löschen?")) return;
        try {
            await pb.collection('questions').delete(id);
            loadData();
        } catch (e: any) {
            alert("Fehler: " + e.message);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" /></div>;
    }

    const selectedLesson = lessons.find(l => l.id === formData.lesson_id);
    const selectedBook = getSelectedBook();
    const isGeneralQuestion = formData.category === "allgemein";

    return (
        <div className="space-y-4">
            {/* Actions */}
            <div className="flex justify-start items-center mb-6">
                {!showForm && (
                    <button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="flex items-center justify-center w-11 h-11 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                        title="Neue Frage"
                    >
                        <Plus size={22} />
                    </button>
                )}
            </div>

            {/* Form Inline */}
            {showForm ? (
                <div className="bg-zinc-50 dark:bg-slate-400/10 dark:backdrop-blur-md rounded-3xl border border-zinc-100 dark:border-white/5 p-6 shadow-2xl animate-fadeIn mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            {editingId ? "Frage bearbeiten" : "Neue Frage"}
                        </h2>
                        <button onClick={resetForm} className="text-zinc-400 hover:text-zinc-600 transition-colors" title="Schließen">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Lektion {isGeneralQuestion ? "(optional)" : "*"}</label>
                                <select
                                    required={!isGeneralQuestion}
                                    value={formData.lesson_id}
                                    onChange={e => setFormData({ ...formData, lesson_id: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                    title="Lektion auswählen"
                                >
                                    <option value="">{isGeneralQuestion ? "Keine Lektion" : "Lektion wählen..."}</option>
                                    {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Kategorie *</label>
                                <div className="flex gap-4">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, category: cat.id, lesson_id: cat.id === "allgemein" ? "" : formData.lesson_id })}
                                            className={clsx(
                                                "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium",
                                                formData.category === cat.id
                                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                                                    : "bg-white/5 opacity-50 border-zinc-200 dark:border-white/5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-slate-800"
                                            )}
                                            title={cat.label}
                                        >
                                            <cat.icon size={18} />
                                            <span className="hidden sm:inline">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Frage *</label>
                            <textarea
                                required
                                value={formData.question}
                                onChange={e => setFormData({ ...formData, question: e.target.value })}
                                placeholder="Die Frage eingeben..."
                                className="w-full p-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-base focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none min-h-[100px] leading-relaxed italic"
                                title="Frage-Text"
                            />
                        </div>

                        {/* Verse Range (only for bibeltext with lesson) */}
                        {formData.category === "bibeltext" && selectedLesson && (
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const isCurrentlyWholeBook = formData.chapter === 0;
                                            if (isCurrentlyWholeBook) {
                                                // Turn OFF whole book -> back to lesson start, reset verse
                                                setFormData({
                                                    ...formData,
                                                    chapter: (selectedLesson.chapter_start || 1),
                                                    verse_start: 1,
                                                    verse_end: 1
                                                });
                                            } else {
                                                // Turn ON whole book -> chapter 0, verse 0
                                                setFormData({
                                                    ...formData,
                                                    chapter: 0,
                                                    verse_start: 0,
                                                    verse_end: 0
                                                });
                                            }
                                        }}
                                        className={clsx(
                                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all",
                                            formData.chapter === 0
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20"
                                                : "bg-zinc-100 dark:bg-slate-700/50 text-zinc-500 border-zinc-200 dark:border-slate-600 hover:bg-zinc-200"
                                        )}
                                    >
                                        <div className={clsx("w-4 h-4 rounded border flex items-center justify-center", formData.chapter === 0 ? "border-white bg-white/20" : "border-zinc-300 dark:border-slate-500 bg-white/5")}>
                                            {formData.chapter === 0 && <div className="w-2.5 h-2.5 bg-white rounded-[2px]" />}
                                        </div>
                                        Ganzes Buch
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const isCurrentlyWholeChapter = formData.verse_start === 0 && formData.chapter !== 0;
                                            if (isCurrentlyWholeChapter) {
                                                // Turn OFF whole chapter -> back to verse 1
                                                setFormData({
                                                    ...formData,
                                                    chapter: formData.chapter === 0 ? (selectedLesson.chapter_start || 1) : formData.chapter,
                                                    verse_start: 1,
                                                    verse_end: 1
                                                });
                                            } else {
                                                // Turn ON whole chapter -> verse 0, ensure chapter is not 0
                                                setFormData({
                                                    ...formData,
                                                    chapter: formData.chapter === 0 ? (selectedLesson.chapter_start || 1) : formData.chapter,
                                                    verse_start: 0,
                                                    verse_end: 0
                                                });
                                            }
                                        }}
                                        className={clsx(
                                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all",
                                            formData.verse_start === 0 && formData.chapter !== 0
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20"
                                                : "bg-zinc-100 dark:bg-slate-700/50 text-zinc-500 border-zinc-200 dark:border-slate-600 hover:bg-zinc-200"
                                        )}
                                    >
                                        <div className={clsx("w-4 h-4 rounded border flex items-center justify-center", formData.verse_start === 0 && formData.chapter !== 0 ? "border-white bg-white/20" : "border-zinc-300 dark:border-slate-500 bg-white/5")}>
                                            {formData.verse_start === 0 && formData.chapter !== 0 && <div className="w-2.5 h-2.5 bg-white rounded-[2px]" />}
                                        </div>
                                        Ganzes Kapitel
                                    </button>
                                </div>

                                {formData.chapter !== 0 && formData.verse_start !== 0 && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 block">Von Vers</label>
                                            <select
                                                value={formData.verse_start}
                                                onChange={e => {
                                                    const newVal = parseInt(e.target.value) || 1;
                                                    setFormData({
                                                        ...formData,
                                                        verse_start: newVal,
                                                        verse_end: Math.max(newVal, formData.verse_end)
                                                    });
                                                }}
                                                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            >
                                                {Array.from({ length: maxVerses }, (_, i) => i + 1).map(num => (
                                                    <option key={num} value={num}>{num}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 block">Bis Vers</label>
                                            <select
                                                value={formData.verse_end}
                                                onChange={e => setFormData({ ...formData, verse_end: parseInt(e.target.value) || 1 })}
                                                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            >
                                                {Array.from({ length: maxVerses }, (_, i) => i + 1).map(num => (
                                                    <option key={num} value={num}>{num}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-indigo-500/10 dark:bg-indigo-500/20 px-4 py-3 rounded-xl border border-indigo-500/30 flex items-center justify-between shadow-inner">
                                    <div className="flex items-center gap-2.5">
                                        <Book size={18} className="text-indigo-500" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600/80 dark:text-indigo-400/80">Vorschau Referenz</span>
                                    </div>
                                    <p className="font-bold text-indigo-700 dark:text-indigo-100">{generateVerseRef()}</p>
                                </div>
                            </div>
                        )}

                        {/* Bible Reference Toggle (only for allgemein) */}
                        {isGeneralQuestion && (
                            <>
                                <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800/30">
                                    <input
                                        type="checkbox"
                                        id="hasBibleRef"
                                        checked={formData.has_bible_ref}
                                        onChange={e => setFormData({ ...formData, has_bible_ref: e.target.checked })}
                                        className="w-5 h-5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="hasBibleRef" className="flex items-center gap-2 text-sm font-medium">
                                        <BookOpen size={16} className="text-indigo-500" />
                                        Mit Bibeltext verknüpfen
                                    </label>
                                </div>

                                {formData.has_bible_ref && (
                                    <>
                                        <div>
                                            <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Buch</label>
                                            <select
                                                value={formData.book_id}
                                                onChange={e => setFormData({ ...formData, book_id: e.target.value, chapter: 1 })}
                                                className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg"
                                            >
                                                <option value="">Buch wählen...</option>
                                                {books.map(b => (
                                                    <option key={b.id} value={b.id}>{b.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {selectedBook && (
                                            <>
                                                <div className="flex gap-2 mb-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const isCurrentlyWholeBook = formData.chapter === 0;
                                                            if (isCurrentlyWholeBook) {
                                                                setFormData({ ...formData, chapter: 1, verse_start: 1, verse_end: 1 });
                                                            } else {
                                                                setFormData({ ...formData, chapter: 0, verse_start: 0, verse_end: 0 });
                                                            }
                                                        }}
                                                        className={clsx(
                                                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all",
                                                            formData.chapter === 0
                                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20"
                                                                : "bg-zinc-100 dark:bg-slate-700/50 text-zinc-500 border-zinc-200 dark:border-slate-600 hover:bg-zinc-200"
                                                        )}
                                                    >
                                                        <div className={clsx("w-4 h-4 rounded border flex items-center justify-center", formData.chapter === 0 ? "border-white bg-white/20" : "border-zinc-300 dark:border-slate-500 bg-white/5")}>
                                                            {formData.chapter === 0 && <div className="w-2.5 h-2.5 bg-white rounded-[2px]" />}
                                                        </div>
                                                        Ganzes Buch
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const isCurrentlyWholeChapter = formData.verse_start === 0 && formData.chapter !== 0;
                                                            if (isCurrentlyWholeChapter) {
                                                                setFormData({
                                                                    ...formData,
                                                                    chapter: formData.chapter === 0 ? 1 : formData.chapter,
                                                                    verse_start: 1,
                                                                    verse_end: 1
                                                                });
                                                            } else {
                                                                setFormData({
                                                                    ...formData,
                                                                    chapter: formData.chapter === 0 ? 1 : formData.chapter,
                                                                    verse_start: 0,
                                                                    verse_end: 0
                                                                });
                                                            }
                                                        }}
                                                        className={clsx(
                                                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all",
                                                            formData.verse_start === 0 && formData.chapter !== 0
                                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20"
                                                                : "bg-zinc-100 dark:bg-slate-700/50 text-zinc-500 border-zinc-200 dark:border-slate-600 hover:bg-zinc-200"
                                                        )}
                                                    >
                                                        <div className={clsx("w-4 h-4 rounded border flex items-center justify-center", formData.verse_start === 0 && formData.chapter !== 0 ? "border-white bg-white/20" : "border-zinc-300 dark:border-slate-500 bg-white/5")}>
                                                            {formData.verse_start === 0 && formData.chapter !== 0 && <div className="w-2.5 h-2.5 bg-white rounded-[2px]" />}
                                                        </div>
                                                        Ganzes Kapitel
                                                    </button>
                                                </div>

                                                {formData.chapter !== 0 && (
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div>
                                                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 block">Kapitel</label>
                                                            <select
                                                                value={formData.chapter}
                                                                onChange={e => setFormData({ ...formData, chapter: parseInt(e.target.value) || 1 })}
                                                                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                                            >
                                                                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(num => (
                                                                    <option key={num} value={num}>{num}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        {formData.verse_start !== 0 && (
                                                            <>
                                                                <div>
                                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 block">Von</label>
                                                                    <select
                                                                        value={formData.verse_start}
                                                                        onChange={e => {
                                                                            const newVal = parseInt(e.target.value) || 1;
                                                                            setFormData({
                                                                                ...formData,
                                                                                verse_start: newVal,
                                                                                verse_end: Math.max(newVal, formData.verse_end)
                                                                            });
                                                                        }}
                                                                        className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                                                    >
                                                                        {Array.from({ length: maxVerses }, (_, i) => i + 1).map(num => (
                                                                            <option key={num} value={num}>{num}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 block">Bis</label>
                                                                    <select
                                                                        value={formData.verse_end}
                                                                        onChange={e => setFormData({ ...formData, verse_end: parseInt(e.target.value) || 1 })}
                                                                        className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                                                    >
                                                                        {Array.from({ length: maxVerses }, (_, i) => i + 1).map(num => (
                                                                            <option key={num} value={num}>{num}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {formData.book_id && (
                                            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg">
                                                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-1">Bibelstelle</p>
                                                <p className="font-semibold text-indigo-800 dark:text-indigo-200">{generateVerseRef()}</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}

                        {/* Answer (Rich Text) */}
                        <div className="pt-4 border-t border-zinc-100 dark:border-white/5">
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Antwort (optional)</label>
                            <div className="dark:bg-slate-900/50 rounded-xl">
                                <RichTextEditor
                                    value={formData.answer}
                                    onChange={val => setFormData({ ...formData, answer: val })}
                                    placeholder="Antwort eingeben oder leer lassen..."
                                />
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-2 flex justify-end">Markdown unterstützt</p>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={!formData.question.trim() || (formData.category === "bibeltext" && !formData.lesson_id)}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                title="Speichern"
                            >
                                <Save size={20} />
                                <span>{editingId ? "Änderungen speichern" : "Frage speichern"}</span>
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            {/* List */}
            {questions.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                    <MessageCircleQuestion className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                    <p>Noch keine Fragen vorhanden.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {(() => {
                        // 1. Group by Book (or "Allgemein" / "Ohne Buch")
                        type BookGroup = {
                            id: string;
                            title: string;
                            order: number;
                            questionCount: number;
                            unansweredCount: number;
                            subgroups: Map<string, Question[]>; // lesson_title -> questions
                        };

                        const bookGroups = new Map<string, BookGroup>();

                        questions.forEach(q => {
                            let bookId = "general";
                            let bookTitle = "Allgemeine Fragen";
                            let bookOrder = 9999;
                            let subgroupTitle = "Allgemeine Fragen";

                            // Sortierhilfe für Subgruppen
                            let subgroupOrder = 0;

                            // Determine Book & Subgroup
                            if (q.lesson_id) {
                                const lesson = lessons.find(l => l.id === q.lesson_id);
                                if (lesson && lesson.book_id) {
                                    const book = books.find(b => b.id === lesson.book_id);
                                    if (book) {
                                        bookId = book.id;
                                        bookTitle = book.name;
                                        bookOrder = book.order || 0;
                                        subgroupTitle = lesson.title;
                                    } else {
                                        subgroupTitle = lesson.title;
                                    }
                                } else if (lesson) {
                                    // Lesson without book (Thema)
                                    bookId = "thema";
                                    bookTitle = "Thematische Lektionen";
                                    bookOrder = 5000;
                                    subgroupTitle = lesson.title;
                                }
                            } else if (q.book_id) {
                                // General question with Bible ref
                                const book = books.find(b => b.id === q.book_id);
                                if (book) {
                                    bookId = book.id;
                                    bookTitle = book.name;
                                    bookOrder = book.order || 0;
                                    subgroupTitle = "Allgemeine Fragen zum Buch";
                                }
                            }

                            // Initialize Book Group
                            if (!bookGroups.has(bookId)) {
                                bookGroups.set(bookId, {
                                    id: bookId,
                                    title: bookTitle,
                                    order: bookOrder,
                                    questionCount: 0,
                                    unansweredCount: 0,
                                    subgroups: new Map()
                                });
                            }

                            const group = bookGroups.get(bookId)!;
                            group.questionCount++;
                            if (!q.is_answered) group.unansweredCount++;

                            // Add to Subgroup
                            if (!group.subgroups.has(subgroupTitle)) {
                                group.subgroups.set(subgroupTitle, []);
                            }
                            group.subgroups.get(subgroupTitle)?.push(q);
                        });

                        // Sort Book Groups
                        const sortedBookGroups = Array.from(bookGroups.values()).sort((a, b) => a.order - b.order);

                        return sortedBookGroups.map(bookGroup => {
                            const isBookSection = bookGroup.id !== "general" && bookGroup.id !== "thema";
                            const isExpanded = expandedGroups.has(bookGroup.id);

                            // Sort subgroups
                            const sortedSubgroups = Array.from(bookGroup.subgroups.entries()).sort((a, b) => {
                                if (a[0] === "Allgemeine Fragen zum Buch") return 1;
                                if (b[0] === "Allgemeine Fragen zum Buch") return -1;
                                return a[0].localeCompare(b[0]);
                            });

                            return (
                                <section key={bookGroup.id} className="bg-zinc-50 dark:bg-slate-700/40 rounded-xl overflow-hidden border border-zinc-200 dark:border-slate-700">
                                    <button
                                        onClick={() => toggleGroup(bookGroup.id)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <h3 className={`text-sm font-bold uppercase tracking-wider ${isBookSection
                                                ? "text-indigo-600 dark:text-indigo-400"
                                                : "text-zinc-600 dark:text-zinc-400"
                                                }`}>
                                                {bookGroup.title}
                                            </h3>
                                            <span className="text-zinc-400 text-xs font-normal">({bookGroup.questionCount})</span>
                                            {bookGroup.unansweredCount > 0 && (
                                                <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                    {bookGroup.unansweredCount} offen
                                                </span>
                                            )}
                                        </div>
                                        {isExpanded ? <ChevronDown size={20} className="text-zinc-400" /> : <ChevronRight size={20} className="text-zinc-400" />}
                                    </button>

                                    {isExpanded && (
                                        <div className="p-3 pt-0 space-y-4 border-t border-zinc-200 dark:border-slate-700">
                                            {sortedSubgroups.map(([subgroupTitle, groupQuestions], idx) => {
                                                const isLast = idx === sortedSubgroups.length - 1;
                                                // Unique key for collapsing logic (combine bookId and subgroupTitle to be safe)
                                                const collapseKey = `${bookGroup.id}-${subgroupTitle}`;
                                                const isSubExpanded = expandedGroups.has(collapseKey);

                                                return (
                                                    <div key={subgroupTitle} className={!isLast ? "border-b border-zinc-200 dark:border-slate-700 pb-4" : ""}>
                                                        <button
                                                            onClick={() => toggleGroup(collapseKey)}
                                                            className="w-full flex items-center justify-between py-2 group"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-300 transition-colors text-left">
                                                                    {subgroupTitle}
                                                                </h4>
                                                                <span className="text-zinc-400 text-[10px] font-normal">({groupQuestions.length})</span>
                                                            </div>
                                                            {isSubExpanded ?
                                                                <ChevronDown size={16} className="text-zinc-300 group-hover:text-zinc-500" /> :
                                                                <ChevronRight size={16} className="text-zinc-300 group-hover:text-zinc-500" />
                                                            }
                                                        </button>

                                                        {isSubExpanded && (
                                                            <div className="space-y-2 mt-1">
                                                                {groupQuestions.map(q => {
                                                                    const catInfo = CATEGORIES.find(c => c.id === q.category);
                                                                    const CatIcon = catInfo?.icon || HelpCircle;
                                                                    const colorClass = q.category === "bibeltext"
                                                                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                                                                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300";

                                                                    return (
                                                                        <div key={q.id} className="bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-lg p-3 flex justify-between items-start gap-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex flex-wrap gap-2 mb-1">
                                                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide flex items-center gap-1 ${colorClass}`}>
                                                                                        <CatIcon size={10} />
                                                                                        {catInfo?.label || "Frage"}
                                                                                    </span>
                                                                                    {/* Show verse reference for both bibeltext and allgemein with Bible ref */}
                                                                                    {q.verse_ref && (
                                                                                        <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                                                                            <BookOpen size={10} /> {q.verse_ref}
                                                                                        </span>
                                                                                    )}
                                                                                    {q.category === "bibeltext" && q.verse_start > 0 && !q.verse_ref && (
                                                                                        <span className="text-[10px] font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md">
                                                                                            V. {q.verse_start}{q.verse_end > q.verse_start ? `-${q.verse_end}` : ""}
                                                                                        </span>
                                                                                    )}
                                                                                    {q.is_answered ? (
                                                                                        <span className="text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded-md">
                                                                                            ✓ Beantwortet
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-md">
                                                                                            Offen
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <p className="font-medium text-zinc-900 dark:text-white text-sm line-clamp-1">{q.question}</p>
                                                                                {q.answer && (
                                                                                    <div className="text-xs text-zinc-500 mt-1 line-clamp-1">
                                                                                        {q.answer.replace(/<[^>]*>?/gm, ' ')}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex gap-1 shrink-0">
                                                                                <button
                                                                                    onClick={() => handleEdit(q)}
                                                                                    className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                                                                                    title="Bearbeiten"
                                                                                >
                                                                                    <Edit size={14} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDelete(q.id)}
                                                                                    className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                                                    title="Löschen"
                                                                                >
                                                                                    <Trash2 size={14} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
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
                    })()}
                </div>
            )}
        </div>
    );
}

