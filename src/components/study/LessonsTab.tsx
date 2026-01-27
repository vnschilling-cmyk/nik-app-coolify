"use client";

import { useState, useEffect, useRef } from "react";
import { pb } from "@/lib/pocketbase";
import { Plus, Upload, Edit, Trash2, X, Save, BookOpen, ChevronDown, ChevronRight, Download } from "lucide-react";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { exportLessonsToExcel } from "@/lib/exportUtils";
interface BibleBook {
    id: string;
    name: string;
    short_name: string;
    chapters: number;
    order: number;
}

interface Lesson {
    id: string;
    title: string;
    content: string;
    category: string;
    order: number;
    verse_ref: string;
    book_id: string;
    chapter_start: number;
    chapter_end: number;
    verse_start: number;
    verse_end: number;
    has_bible_ref: boolean;
    start_date: string;
    active: boolean;
}

const CATEGORIES = ["Bibelarbeit", "Gruppenarbeit", "Exkurs", "Thema"];

export default function LessonsTab() {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [books, setBooks] = useState<BibleBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        category: "Bibelarbeit",
        has_bible_ref: true,
        book_id: "",
        chapter: 1,
        verse_start: 1,
        verse_end: 10,
        title: "",
        content: "",
        start_date: "",
        active: true
    });
    const [contentItems, setContentItems] = useState<any[]>([]);
    const [loadingContent, setLoadingContent] = useState(false);
    const [maxVerses, setMaxVerses] = useState(176);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());

    const toggleSelection = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedLessons);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedLessons(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedLessons.size === lessons.length) {
            setSelectedLessons(new Set());
        } else {
            setSelectedLessons(new Set(lessons.map(l => l.id)));
        }
    };

    const handleExport = () => {
        exportLessonsToExcel(Array.from(selectedLessons));
    };

    const toggleGroup = (group: string) => {
        const newSet = new Set(expandedGroups);
        if (newSet.has(group)) {
            newSet.delete(group);
        } else {
            newSet.add(group);
        }
        setExpandedGroups(newSet);
    };

    // Fetch verse count when book or chapter changes
    useEffect(() => {
        if (formData.book_id && formData.chapter) {
            updateMaxVerses();
        }
    }, [formData.book_id, formData.chapter]);

    const updateMaxVerses = async () => {
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

    useEffect(() => {
        loadBooks();
        loadLessons();
    }, []);

    const loadBooks = async () => {
        try {
            const records = await pb.collection('bible_books').getFullList({ sort: 'order' });
            setBooks(records.map(r => ({
                id: r.id,
                name: r.name,
                short_name: r.short_name,
                chapters: r.chapter_count || 50,
                order: r.order || 0
            })));
        } catch (e) {
            console.error("Failed to load books:", e);
        }
    };

    const loadLessons = async () => {
        try {
            const records = await pb.collection('lessons').getFullList({ sort: 'order,title' });
            setLessons(records.map(r => ({
                id: r.id,
                title: r.title,
                content: r.content || "",
                category: r.category || "",
                order: r.order || 0,
                verse_ref: r.verse_ref || "",
                book_id: r.book_id || "",
                chapter_start: r.chapter_start || 1,
                chapter_end: r.chapter_end || 1,
                verse_start: r.verse_start || 1,
                verse_end: r.verse_end || 10,
                has_bible_ref: r.book_id ? true : false,
                start_date: r.start_date || "",
                active: r.active ?? true
            })));
        } catch (e: any) {
            if (e.isAbort) return;
            console.error("Failed to load lessons:", e);
            const message = e instanceof Error ? e.message : "Unbekannter Fehler";
            alert("Fehler beim Laden der Lektionen: " + message);
        } finally {
            setLoading(false);
        }
    };

    const getSelectedBook = () => books.find(b => b.id === formData.book_id);

    const generateTitle = () => {
        if (!formData.has_bible_ref || !formData.book_id) {
            return formData.title;
        }
        const book = getSelectedBook();
        if (!book) return formData.title;

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
            title: formData.title,
            category: formData.category,
            content: formData.content,
            order: lessons.length,
            start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
            active: formData.active
        };

        if (formData.has_bible_ref && formData.book_id) {
            data.verse_ref = generateTitle();
            data.book_id = formData.book_id;
            // If chapter is 0 (whole book), store 0.
            data.chapter_start = formData.chapter;
            data.chapter_end = formData.chapter;
            data.verse_start = formData.chapter === 0 ? 0 : formData.verse_start;
            data.verse_end = formData.chapter === 0 ? 0 : formData.verse_end;
        } else {
            data.verse_ref = "";
            data.book_id = "";
            data.chapter_start = 0;
            data.chapter_end = 0;
            data.verse_start = 0;
            data.verse_end = 0;
        }

        try {
            if (editingId) {
                await pb.collection('lessons').update(editingId, data);
            } else {
                await pb.collection('lessons').create(data);
            }
            resetForm();
            loadLessons();
        } catch (e: any) {
            alert("Fehler: " + e.message);
        }
    };

    const resetForm = () => {
        setFormData({
            category: "Bibelarbeit",
            has_bible_ref: true,
            book_id: "",
            chapter: 1,
            verse_start: 1,
            verse_end: 10,
            title: "",
            content: "",
            start_date: "",
            active: true
        });
        setShowForm(false);
        setEditingId(null);
    };

    const handleEdit = (lesson: Lesson) => {
        const hasBibleRef = !!lesson.book_id;

        let formattedDate = "";
        if (lesson.start_date) {
            const date = new Date(lesson.start_date);
            const offset = date.getTimezoneOffset() * 60000;
            formattedDate = new Date(date.getTime() - offset).toISOString().slice(0, 16);
        }

        setFormData({
            category: lesson.category || "Bibelarbeit",
            has_bible_ref: hasBibleRef,
            book_id: lesson.book_id,
            chapter: lesson.chapter_start,
            verse_start: lesson.verse_start || 1,
            verse_end: lesson.verse_end || 10,
            title: lesson.title,
            content: lesson.content,
            start_date: formattedDate,
            active: lesson.active
        });
        setEditingId(lesson.id);
        setShowForm(true);
        loadContentItems(lesson.id);
    };

    const loadContentItems = async (lessonId: string) => {
        setLoadingContent(true);
        try {
            const [f, q] = await Promise.all([
                pb.collection('facts').getFullList({ filter: `lesson_id="${lessonId}"`, sort: 'order' }),
                pb.collection('questions').getFullList({ filter: `lesson_id="${lessonId}"`, sort: 'order' })
            ]);

            const combined = [
                ...f.map(i => ({ ...i, _itemType: 'fact' as const })),
                ...q.map(i => ({ ...i, _itemType: 'question' as const }))
            ].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

            setContentItems(combined);
        } catch (e) {
            console.error("Failed to load content items:", e);
        } finally {
            setLoadingContent(false);
        }
    };

    const moveItem = async (index: number, direction: 'up' | 'down') => {
        const newItems = [...contentItems];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newItems.length) return;

        const temp = newItems[index];
        newItems[index] = newItems[targetIndex];
        newItems[targetIndex] = temp;

        // Set local state immediately for snappy UI
        setContentItems([...newItems]);

        // Persist to DB
        try {
            for (let i = 0; i < newItems.length; i++) {
                const item = newItems[i];
                const collection = item._itemType === 'fact' ? 'facts' : 'questions';
                if (item.order !== i) {
                    await pb.collection(collection).update(item.id, { order: i });
                    item.order = i;
                }
            }
        } catch (e) {
            console.error("Failed to save order:", e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Lektion wirklich löschen?")) return;
        try {
            await pb.collection('lessons').delete(id);
            loadLessons();
        } catch (e: any) {
            alert("Fehler: " + e.message);
        }
    };

    const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        const lines = text.split('\n').filter(l => l.trim());
        let imported = 0;
        for (let i = 1; i < lines.length; i++) {
            const [title, content, category] = lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
            if (title) {
                try {
                    await pb.collection('lessons').create({ title, content, category, order: i });
                    imported++;
                } catch (e) {
                    console.error(`Failed to import line ${i}:`, e);
                }
            }
        }
        alert(`${imported} Lektionen importiert!`);
        loadLessons();
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (loading) {
        return <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" /></div>;
    }

    const selectedBook = getSelectedBook();
    const isThema = formData.category === "Thema";

    return (
        <div className="space-y-4">
            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
                    title="Neue Lektion"
                >
                    <Plus size={20} />
                </button>
                <label
                    className="flex items-center justify-center w-10 h-10 bg-zinc-100 dark:bg-slate-800 text-zinc-700 dark:text-slate-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
                    title="CSV Import"
                >
                    <Upload size={20} />
                    <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleCSVImport} />
                </label>

                <div className="flex-1" />

                {lessons.length > 0 && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleSelectAll}
                            className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 px-2"
                        >
                            {selectedLessons.size === lessons.length ? "Keine" : "Alle"}
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={selectedLessons.size === 0}
                            className="flex items-center justify-center w-10 h-10 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
                            title={`Export (${selectedLessons.size})`}
                        >
                            <Download size={20} />
                            {selectedLessons.size > 0 && (
                                <span className="absolute -top-1 -right-1 bg-white text-emerald-600 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm border border-emerald-100">
                                    {selectedLessons.size}
                                </span>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-slate-800/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">{editingId ? "Lektion bearbeiten" : "Neue Lektion"}</h3>
                            <button onClick={resetForm} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Category - AT TOP */}
                            <div>
                                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Kategorie *</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg font-medium"
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Bible Reference Toggle */}
                            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-slate-700 rounded-lg">
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

                            {/* Bible Reference Fields */}
                            {formData.has_bible_ref && (
                                <>
                                    <div>
                                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Buch *</label>
                                        <select
                                            required={formData.has_bible_ref}
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
                                            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-slate-700 rounded-lg">
                                                <input
                                                    type="checkbox"
                                                    id="wholeBook"
                                                    checked={formData.chapter === 0}
                                                    onChange={e => {
                                                        setFormData({
                                                            ...formData,
                                                            chapter: e.target.checked ? 0 : 1,
                                                            verse_start: e.target.checked ? 0 : 1,
                                                            verse_end: e.target.checked ? 0 : 10
                                                        });
                                                    }}
                                                    className="w-5 h-5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <label htmlFor="wholeBook" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2 cursor-pointer">
                                                    Ganzes Buch (ohne Kapitel/Verse)
                                                </label>
                                            </div>

                                            {formData.chapter !== 0 && (
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Kapitel</label>
                                                        <select
                                                            value={formData.chapter}
                                                            onChange={e => {
                                                                const newChapter = parseInt(e.target.value) || 1;
                                                                setFormData(prev => {
                                                                    return { ...prev, chapter: newChapter };
                                                                });
                                                            }}
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

                                            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg flex justify-between items-center">
                                                <div>
                                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-1">Automatische Referenz</p>
                                                    <p className="font-semibold text-indigo-800 dark:text-indigo-200">{generateTitle()}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, title: generateTitle() })}
                                                    className="text-xs bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded hover:bg-indigo-300 transition-colors"
                                                >
                                                    Als Titel übernehmen
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}

                            {/* Title Input - Always visible */}
                            <div>
                                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Titel *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg"
                                    placeholder={formData.has_bible_ref ? "Titel der Lektion (z.B. Die Schöpfung)" : "z.B. Die Bedeutung der Taufe"}
                                />
                            </div>

                            {/* Scheduling */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Startdatum</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.start_date}
                                        onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg text-sm dark:[color-scheme:dark]"
                                    />
                                </div>
                                <div className="flex flex-col justify-end">
                                    <label className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-slate-700 rounded-lg cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.active}
                                            onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                            className="w-5 h-5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Aktiv</span>
                                    </label>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <RichTextEditor
                                    label={isThema ? "Thema-Beschreibung" : "Kurzbeschreibung"}
                                    value={formData.content}
                                    onChange={(val: string) => setFormData({ ...formData, content: val })}
                                    placeholder={isThema ? "Beschreibe das Thema ausführlich..." : "Optional: Kurze Beschreibung der Lektion..."}
                                />
                            </div>

                            {/* Content Management Section */}
                            {editingId && (
                                <div className="mt-6 border-t pt-4 border-zinc-100 dark:border-slate-700">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Lektions-Inhalt & Sortierung</h4>
                                        <span className="text-[10px] bg-zinc-100 dark:bg-slate-700 px-2 py-0.5 rounded text-zinc-500">{contentItems.length} Elemente</span>
                                    </div>

                                    {loadingContent ? (
                                        <div className="flex justify-center py-4"><div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full" /></div>
                                    ) : contentItems.length === 0 ? (
                                        <p className="text-xs text-zinc-500 italic text-center py-4">Keine Infos oder Fragen verknüpft.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {contentItems.map((item, idx) => (
                                                <div key={item.id} className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-slate-700/50 border border-zinc-100 dark:border-slate-700 rounded-lg group">
                                                    <div className={`w-1.5 h-full self-stretch rounded-full ${item._itemType === 'fact' ? 'bg-amber-400' : 'bg-emerald-400'}`} title={item._itemType === 'fact' ? 'Info' : 'Frage'} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] font-bold text-zinc-400 uppercase leading-tight">
                                                            {item._itemType === 'fact' ? 'Info' : 'Frage'}
                                                            {(item.verse_start > 0 || (item._itemType === 'fact' && item.chapter > 0)) && ` • ${item.chapter > 0 ? `${item.chapter}:` : ''}${item.verse_start}`}
                                                        </p>
                                                        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate">
                                                            {item._itemType === 'fact' ? item.title : item.question}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            type="button"
                                                            disabled={idx === 0}
                                                            onClick={() => moveItem(idx, 'up')}
                                                            className="p-1 text-zinc-400 hover:text-indigo-600 disabled:opacity-20 transition-all shadow-none h-auto w-auto bg-transparent border-none"
                                                        >
                                                            <ChevronRight size={14} className="-rotate-90" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={idx === contentItems.length - 1}
                                                            onClick={() => moveItem(idx, 'down')}
                                                            className="p-1 text-zinc-400 hover:text-indigo-600 disabled:opacity-20 transition-all shadow-none h-auto w-auto bg-transparent border-none"
                                                        >
                                                            <ChevronRight size={14} className="rotate-90" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <p className="text-[9px] text-zinc-400 mt-3 italic">
                                        💡 Hier kannst du die Reihenfolge von Infos und Fragen festlegen. Dies ist besonders wichtig für Lektionen ohne direkten Bibeltext.
                                    </p>
                                </div>
                            )}

                            {/* Validation Message */}
                            {formData.has_bible_ref && !formData.book_id && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-300">
                                    ⚠️ Bitte wähle ein Buch aus oder deaktiviere "Mit Bibeltext verknüpfen"
                                </div>
                            )}

                            {!formData.has_bible_ref && !formData.title.trim() && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-300">
                                    ⚠️ Bitte gib einen Titel ein
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={!formData.title.trim()}
                                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={16} /> Speichern
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* List */}
            {lessons.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                    <p className="text-4xl mb-2">📚</p>
                    <p>Noch keine Lektionen vorhanden.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {(() => {
                        // Grouping Logic
                        const groups = new Map<string, Lesson[]>();

                        lessons.forEach(lesson => {
                            let key = lesson.category || "Allgemein";

                            // Check if lesson belongs to a book
                            if (lesson.book_id) {
                                const book = books.find(b => b.id === lesson.book_id);
                                if (book) {
                                    key = book.name;
                                }
                            } else if (lesson.category === "Thema") {
                                key = "Thema";
                            }

                            if (!groups.has(key)) {
                                groups.set(key, []);
                            }
                            groups.get(key)?.push(lesson);
                        });

                        // Sort lessons within each group by date
                        groups.forEach(groupLessons => {
                            groupLessons.sort((a, b) => {
                                if (!a.start_date) return 1;
                                if (!b.start_date) return -1;
                                return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
                            });
                        });

                        // Convert to array and sort
                        const sortedGroups = Array.from(groups.entries()).sort((a, b) => {
                            const [keyA, lessonsA] = a;
                            const [keyB, lessonsB] = b;

                            // Determine sort order based on first lesson in group
                            const getOrder = (key: string, groupLessons: Lesson[]) => {
                                // If it's a book group, finding the book order
                                const firstLesson = groupLessons[0];
                                if (firstLesson.book_id) {
                                    const book = books.find(b => b.id === firstLesson.book_id);
                                    if (book) return book.order;
                                }
                                if (key === "Thema") return 3000;
                                return 4000; // Other categories last
                            };

                            const orderA = getOrder(keyA, lessonsA);
                            const orderB = getOrder(keyB, lessonsB);

                            if (orderA !== orderB) return orderA - orderB;
                            return keyA.localeCompare(keyB);
                        });

                        return sortedGroups.map(([groupTitle, groupLessons]) => {
                            const isBookGroup = !!groupLessons[0].book_id;
                            const isThemaGroup = groupTitle === "Thema";
                            const isExpanded = expandedGroups.has(groupTitle);

                            return (
                                <section key={groupTitle} className="bg-zinc-50 dark:bg-slate-700/40 rounded-xl overflow-hidden border border-zinc-200 dark:border-slate-700">
                                    <button
                                        onClick={() => toggleGroup(groupTitle)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-zinc-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <h3 className={`text-sm font-bold uppercase tracking-wider ${isThemaGroup
                                            ? "text-purple-600 dark:text-purple-400"
                                            : isBookGroup
                                                ? "text-indigo-600 dark:text-indigo-400"
                                                : "text-zinc-600 dark:text-zinc-400"
                                            }`}>
                                            {groupTitle} <span className="text-zinc-400 text-xs ml-2 font-normal">({groupLessons.length})</span>
                                        </h3>
                                        {isExpanded ? <ChevronDown size={20} className="text-zinc-400" /> : <ChevronRight size={20} className="text-zinc-400" />}
                                    </button>

                                    {isExpanded && (
                                        <div className="p-2 space-y-2 border-t border-zinc-200 dark:border-slate-800">
                                            {groupLessons.map(lesson => (
                                                <div key={lesson.id} className="bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-800 rounded-lg p-3 flex justify-between items-start gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-pointer" onClick={(e) => toggleSelection(lesson.id, e)}>
                                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedLessons.has(lesson.id)}
                                                            onChange={(e) => { /* handled by parent click to make hit area larger, but prevent double toggle */ }}
                                                            className="mt-1.5 w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap gap-2 mb-1">
                                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${lesson.category === "Thema"
                                                                    ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30"
                                                                    : "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30"
                                                                    }`}>
                                                                    {lesson.category || "Allgemein"}
                                                                </span>
                                                                {lesson.book_id && (
                                                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                                                        <BookOpen size={10} /> Bibeltext
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h4 className="font-semibold text-zinc-900 dark:text-white text-sm">
                                                                {!lesson.active && <span className="text-zinc-400 mr-2 text-xs font-normal">(Inaktiv)</span>}
                                                                {lesson.title}
                                                            </h4>
                                                            {lesson.start_date && (
                                                                <p className="text-[10px] text-indigo-500 font-medium mt-0.5">
                                                                    📅 {new Date(lesson.start_date).toLocaleDateString()} um {new Date(lesson.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            )}
                                                            {lesson.content && (
                                                                <div className="text-xs text-zinc-500 mt-1 line-clamp-1">
                                                                    {lesson.content.replace(/<[^>]*>?/gm, ' ')}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 shrink-0">
                                                        <button
                                                            onClick={() => handleEdit(lesson)}
                                                            className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                                            title="Bearbeiten"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(lesson.id)}
                                                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                            title="Löschen"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
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
