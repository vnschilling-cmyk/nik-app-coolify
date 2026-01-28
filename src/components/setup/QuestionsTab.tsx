"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { Plus, Edit, Trash2, X, Save, BookOpen, ChevronDown, ChevronRight, MessageCircleQuestion, HelpCircle } from "lucide-react";
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
                pb.collection('questions').getFullList({ sort: 'lesson_id,order,question' }),
                pb.collection('lessons').getFullList({ sort: 'title' }),
                pb.collection('bible_books').getFullList({ sort: 'order' })
            ]);

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
            })));

            setLessons(lessonsRes.map(r => ({
                id: r.id,
                title: r.title || "(Ohne Titel)",
                book_id: r.book_id || "",
                chapter_start: r.chapter_start || 1,
                verse_start: r.verse_start || 1,
                verse_end: r.verse_end || 10
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
            }
        } else if (formData.category === "allgemein" && formData.has_bible_ref && formData.book_id && formData.chapter) {
            updateMaxVersesForBook();
        }
    }, [formData.lesson_id, formData.category, formData.book_id, formData.chapter, formData.has_bible_ref, lessons]);

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
            data.verse_start = formData.verse_start;
            data.verse_end = formData.verse_end;
            data.book_id = "";
            data.chapter = 0;
            data.verse_ref = "";
        } else {
            // General questions - lesson is optional, but can have Bible reference
            data.lesson_id = formData.lesson_id || "";

            if (formData.has_bible_ref && formData.book_id) {
                data.book_id = formData.book_id;
                // If chapter is 0 (whole book), store 0.
                data.chapter = formData.chapter;
                data.verse_start = formData.chapter === 0 ? 0 : formData.verse_start;
                data.verse_end = formData.chapter === 0 ? 0 : formData.verse_end;
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
            verse_start: q.verse_start || 1,
            verse_end: q.verse_end || 1,
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
            {showForm && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-zinc-200 dark:border-slate-700 p-5 animate-fadeIn">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">{editingId ? "Frage bearbeiten" : "Neue Frage"}</h3>
                        <button onClick={resetForm} className="text-zinc-400 hover:text-zinc-600"><X size={24} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Lesson Selector - Required for bibeltext, Optional for allgemein */}
                        <div>
                            <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                Lektion {isGeneralQuestion ? "(optional)" : "*"}
                            </label>
                            <select
                                required={!isGeneralQuestion}
                                value={formData.lesson_id}
                                onChange={e => setFormData({ ...formData, lesson_id: e.target.value })}
                                className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg"
                            >
                                <option value="">{isGeneralQuestion ? "Keine Lektion" : "Lektion wählen..."}</option>
                                {lessons.map(l => (
                                    <option key={l.id} value={l.id}>{l.title}</option>
                                ))}
                            </select>
                        </div>

                        {/* Category Selector */}
                        <div>
                            <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Kategorie *</label>
                            <div className="flex gap-2 mt-1">
                                {CATEGORIES.map(cat => {
                                    const Icon = cat.icon;
                                    const isSelected = formData.category === cat.id;
                                    const activeClass = cat.id === "bibeltext"
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
                                        : "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20";
                                    const inactiveClass = "bg-white dark:bg-slate-700 text-zinc-400 border-zinc-200 dark:border-slate-600 hover:bg-zinc-50 dark:hover:bg-slate-600";

                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, category: cat.id, lesson_id: cat.id === "allgemein" ? "" : formData.lesson_id })}
                                            className={`flex-1 flex items-center justify-center py-3 rounded-lg border transition-all ${isSelected ? activeClass : inactiveClass}`}
                                            title={cat.label}
                                        >
                                            <Icon size={24} />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Verse Range (only for bibeltext with lesson) */}
                        {formData.category === "bibeltext" && selectedLesson && (
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Von Vers</label>
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
                                        className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg"
                                    >
                                        {Array.from({ length: maxVerses }, (_, i) => i + 1).map(num => (
                                            <option key={num} value={num}>{num}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Bis Vers</label>
                                    <select
                                        value={formData.verse_end}
                                        onChange={e => setFormData({ ...formData, verse_end: parseInt(e.target.value) || 1 })}
                                        className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg"
                                    >
                                        {Array.from({ length: maxVerses }, (_, i) => i + 1).map(num => (
                                            <option key={num} value={num}>{num}</option>
                                        ))}
                                    </select>
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
                                                <div className="mb-2">
                                                    <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.chapter === 0}
                                                            onChange={e => {
                                                                setFormData({
                                                                    ...formData,
                                                                    chapter: e.target.checked ? 0 : 1,
                                                                    verse_start: e.target.checked ? 0 : 1,
                                                                    verse_end: e.target.checked ? 0 : 1
                                                                });
                                                            }}
                                                            className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        Ganzes Buch (ohne Kapitel/Verse)
                                                    </label>
                                                </div>

                                                {formData.chapter !== 0 && (
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div>
                                                            <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Kapitel</label>
                                                            <select
                                                                value={formData.chapter}
                                                                onChange={e => setFormData({ ...formData, chapter: parseInt(e.target.value) || 1 })}
                                                                className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg"
                                                            >
                                                                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(num => (
                                                                    <option key={num} value={num}>{num}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Von Vers</label>
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
                                                                className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg"
                                                            >
                                                                {Array.from({ length: maxVerses }, (_, i) => i + 1).map(num => (
                                                                    <option key={num} value={num}>{num}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Bis Vers</label>
                                                            <select
                                                                value={formData.verse_end}
                                                                onChange={e => setFormData({ ...formData, verse_end: parseInt(e.target.value) || 1 })}
                                                                className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg"
                                                            >
                                                                {Array.from({ length: maxVerses }, (_, i) => i + 1).map(num => (
                                                                    <option key={num} value={num}>{num}</option>
                                                                ))}
                                                            </select>
                                                        </div>
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

                        {/* Question Text */}
                        <div>
                            <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Frage *</label>
                            <textarea
                                required
                                value={formData.question}
                                onChange={e => setFormData({ ...formData, question: e.target.value })}
                                className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg min-h-[80px]"
                                placeholder="Die Frage eingeben..."
                            />
                        </div>

                        {/* Answer (Rich Text) */}
                        <div>
                            <RichTextEditor
                                label="Antwort (optional)"
                                value={formData.answer}
                                onChange={(val: string) => setFormData({ ...formData, answer: val })}
                                placeholder="Antwort eingeben oder leer lassen..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!formData.question.trim() || (formData.category === "bibeltext" && !formData.lesson_id)}
                            className="w-full py-3 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                            title={editingId ? "Änderungen speichern" : "Speichern"}
                        >
                            <Save size={24} />
                        </button>
                    </form>
                </div>
            )}

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

