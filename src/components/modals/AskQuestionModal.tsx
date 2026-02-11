"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { useAuth } from "@/hooks/useAuth";
import { X, Save, BookOpen, HelpCircle } from "lucide-react";
import clsx from "clsx";

interface AskQuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved?: () => void;
    initialData?: any; // If provided, we are in EDIT mode
    title?: string; // Optional title override
}

const CATEGORIES = [
    { id: "bibeltext", label: "Bibeltext-Frage", icon: BookOpen, color: "indigo" },
    { id: "allgemein", label: "Allgemeine Frage", icon: HelpCircle, color: "emerald" },
];

export default function AskQuestionModal({ isOpen, onClose, onSaved, initialData, title }: AskQuestionModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Data for dropdowns
    const [lessons, setLessons] = useState<any[]>([]);
    const [bibleBooks, setBibleBooks] = useState<any[]>([]);
    const [maxVerses, setMaxVerses] = useState(50);

    const [formData, setFormData] = useState({
        question: "",
        category: "allgemein",
        lesson_id: "",
        book_id: "",
        chapter: 1,
        verse_start: 1,
        verse_end: 1,
        is_answered: false,
        isWholeBook: false
    });

    useEffect(() => {
        if (isOpen) {
            loadData();
            if (initialData) {
                // Populate form for editing
                setFormData({
                    question: initialData.question || "",
                    category: initialData.category || "allgemein",
                    lesson_id: initialData.lesson_id || "",
                    book_id: initialData.book_id || "",
                    chapter: initialData.chapter || 1,
                    verse_start: initialData.verse_start || 1,
                    verse_end: initialData.verse_end || 1,
                    is_answered: initialData.is_answered || false,
                    isWholeBook: (initialData.chapter === 0 || !initialData.chapter) && initialData.category === 'bibeltext'
                });
            } else {
                // Reset form for new question
                setFormData({
                    question: "",
                    category: "allgemein",
                    lesson_id: "",
                    book_id: "",
                    chapter: 1,
                    verse_start: 1,
                    verse_end: 1,
                    is_answered: false,
                    isWholeBook: false
                });
            }
        }
    }, [isOpen, initialData]);

    // Update max verses when lesson or book changes
    useEffect(() => {
        if (!formData.book_id || !formData.chapter) return;

        // If we have a lesson selected that matches the book/chapter, use its verse count?
        // Actually, let's just fetch verse count for the selected book/chapter from 'verses' collection
        // OR rely on the lesson's verse_end if available and matching.
        // For simplicity, let's try to fetch actual verse count if possible, or fallback.

        const fetchMaxVerses = async () => {
            // Only fetch if we are in bibeltext mode or have a book selected
            if (formData.category === "bibeltext" || formData.book_id) {
                try {
                    const record = await pb.collection('verses').getList(1, 1, {
                        filter: `book="${formData.book_id}" && chapter=${formData.chapter}`,
                        sort: '-verse',
                        fields: 'verse'
                    });
                    if (record.items.length > 0) {
                        setMaxVerses(record.items[0].verse);
                    } else {
                        setMaxVerses(176); // Fallback
                    }
                } catch (e) {
                    console.error("Error fetching max verses", e);
                }
            }
        };

        fetchMaxVerses();
    }, [formData.book_id, formData.chapter, formData.category]);


    const loadData = async () => {
        setLoading(true);
        try {
            const [lessonsRes, booksRes] = await Promise.all([
                pb.collection('lessons').getFullList({ sort: 'title' }),
                pb.collection('bible_books').getFullList({ sort: 'order' })
            ]);
            setLessons(lessonsRes);
            setBibleBooks(booksRes);
        } catch (e) {
            console.error("Error loading modal data:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.question.trim()) return;

        setSaving(true);
        try {
            const data: any = {
                question: formData.question,
                category: formData.category,
                lesson_id: formData.lesson_id,
                // Keep answer status/text if editing? 
                // Usually users can't edit the answer, but they can edit their question.
                // We should probably preserve 'answer' and 'is_answered' from initialData if editing.
            };

            if (formData.category === "bibeltext") {
                data.book_id = formData.book_id;

                if (formData.isWholeBook) {
                    data.chapter = 0;
                    data.verse_start = 0;
                    data.verse_end = 0;
                } else {
                    data.chapter = formData.chapter;
                    data.verse_start = formData.verse_start;
                    data.verse_end = formData.verse_end;
                }

                // Generate verse_ref string for easy display
                const book = bibleBooks.find(b => b.id === formData.book_id);
                if (book) {
                    if (formData.isWholeBook) {
                        data.verse_ref = book.name;
                    } else {
                        data.verse_ref = `${book.name} ${formData.chapter}:${formData.verse_start}${formData.verse_end > formData.verse_start ? `-${formData.verse_end}` : ""}`;
                    }
                }
            } else {
                // Reset bible fields if switching to Allgemein
                data.book_id = "";
                data.chapter = 0;
                data.verse_start = 0;
                data.verse_end = 0;
                data.verse_ref = "";
            }

            if (initialData?.id) {
                await pb.collection('questions').update(initialData.id, data);
            } else {
                data.user = user?.id;
                data.created_by_name = user?.name;
                data.is_answered = false;
                await pb.collection('questions').create(data);
            }

            if (onSaved) onSaved();
            onClose();
        } catch (e: any) {
            console.error("Error saving question:", e);
            alert("Fehler beim Speichern: " + e.message);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto overscroll-contain">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white">
                        {title || (initialData ? "Frage bearbeiten" : "Neue Frage stellen")}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-slate-700 rounded-full transition-colors text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                        aria-label="Schließen"
                        title="Schließen"
                    >
                        <X size={20} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Category Selector */}
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3 block">Kategorie</label>
                            <div className="grid grid-cols-2 gap-3">
                                {CATEGORIES.map(cat => {
                                    const Icon = cat.icon;
                                    const isSelected = formData.category === cat.id;

                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, category: cat.id })}
                                            className={clsx(
                                                "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all",
                                                isSelected
                                                    ? `bg-${cat.color}-50 dark:bg-${cat.color}-900/20 border-${cat.color}-500 text-${cat.color}-700 dark:text-${cat.color}-300 ring-2 ring-${cat.color}-500/20`
                                                    : "bg-zinc-50 dark:bg-slate-700/50 border-zinc-200 dark:border-white/5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-slate-700"
                                            )}
                                            title={cat.label}
                                        >
                                            <Icon size={24} className={isSelected ? "" : "opacity-50"} />
                                            <span className="text-xs font-bold uppercase tracking-tight">{cat.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Bibeltext Fields */}
                        {formData.category === "bibeltext" && (
                            <div className="space-y-4 animate-fadeIn p-4 bg-zinc-50 dark:bg-slate-900/50 rounded-2xl border border-zinc-100 dark:border-white/5">
                                <div>
                                    <label htmlFor="book_select" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">Bibelbuch *</label>
                                    <select
                                        id="book_select"
                                        required
                                        value={formData.book_id}
                                        onChange={e => setFormData({ ...formData, book_id: e.target.value, chapter: 1 })}
                                        className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Buch wählen...</option>
                                        {bibleBooks.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-2 px-1">
                                    <div
                                        onClick={() => setFormData({ ...formData, isWholeBook: !formData.isWholeBook })}
                                        className={clsx(
                                            "w-5 h-5 rounded flex items-center justify-center border cursor-pointer transition-all",
                                            formData.isWholeBook ? "bg-indigo-600 border-indigo-600" : "bg-white dark:bg-slate-800 border-zinc-300 dark:border-slate-600"
                                        )}
                                    >
                                        {formData.isWholeBook && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                    <label onClick={() => setFormData({ ...formData, isWholeBook: !formData.isWholeBook })} className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                        Frage zum ganzen Buch (ohne Kapitel/Vers)
                                    </label>
                                </div>

                                {!formData.isWholeBook && (
                                    <div className="grid grid-cols-3 gap-2 animate-fadeIn">
                                        <div>
                                            <label htmlFor="chapter_input" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">Kapitel *</label>
                                            <select
                                                id="chapter_input"
                                                required={!formData.isWholeBook}
                                                value={formData.chapter}
                                                onChange={e => setFormData({ ...formData, chapter: parseInt(e.target.value) || 1 })}
                                                className="w-full px-2 py-3 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-center font-mono"
                                            >
                                                {(() => {
                                                    const book = bibleBooks.find(b => b.id === formData.book_id);
                                                    const chapters = book ? (book.chapter_count || 50) : 150;
                                                    return Array.from({ length: chapters }, (_, i) => i + 1).map(num => (
                                                        <option key={num} value={num}>{num}</option>
                                                    ));
                                                })()}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="verse_start" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">Von Vers</label>
                                            <input
                                                id="verse_start"
                                                type="number"
                                                min="1"
                                                max={maxVerses}
                                                value={formData.verse_start}
                                                onChange={e => setFormData({ ...formData, verse_start: parseInt(e.target.value) || 1 })}
                                                className="w-full px-2 py-3 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-center font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="verse_end" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">Bis Vers</label>
                                            <input
                                                id="verse_end"
                                                type="number"
                                                min="1"
                                                max={maxVerses}
                                                value={formData.verse_end}
                                                onChange={e => setFormData({ ...formData, verse_end: parseInt(e.target.value) || 1 })}
                                                className="w-full px-2 py-3 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-center font-mono"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Question Text */}
                        <div>
                            <label htmlFor="question_textarea" className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Deine Frage *</label>
                            <textarea
                                id="question_textarea"
                                required
                                value={formData.question}
                                onChange={e => setFormData({ ...formData, question: e.target.value })}
                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-slate-700/50 border border-zinc-200 dark:border-white/5 rounded-2xl min-h-[120px] text-base focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none leading-relaxed"
                                placeholder={formData.category === 'bibeltext' ? "Was ist dir an dieser Stelle unklar?" : "Was beschäftigt dich?"}
                            />
                        </div>

                        {/* Lesson Relation (Optional) */}
                        <div>
                            <label htmlFor="lesson_select" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">Lektionsbezug (Optional)</label>
                            <select
                                id="lesson_select"
                                value={formData.lesson_id}
                                onChange={e => setFormData({ ...formData, lesson_id: e.target.value })}
                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-slate-700/50 border border-zinc-200 dark:border-white/5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Kein Lektionsbezug</option>
                                {lessons.map(l => (
                                    <option key={l.id} value={l.id}>{l.title}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={saving || !formData.question.trim() || (formData.category === "bibeltext" && !formData.book_id)}
                            className={clsx(
                                "w-full py-4 text-white rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]",
                                formData.category === "bibeltext" ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                            )}
                        >
                            <Save size={18} /> {saving ? "Speichern..." : (initialData ? "Änderungen speichern" : "Frage absenden")}
                        </button>
                    </form>
                )}
            </div>
        </div >
    );
}
