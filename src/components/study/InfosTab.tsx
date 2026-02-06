"use client";

import { useState, useEffect, useRef } from "react";
import { pb } from "@/lib/pocketbase";
import { Plus, Upload, Edit, Trash2, X, Save, BookOpen, Link, ChevronDown, ChevronRight, Image as ImageIcon, Video, FileText, Map as MapIcon, ExternalLink, Search, Sparkles, User } from "lucide-react";
import RichTextEditor from "@/components/ui/RichTextEditor";
import QuoteSelectionModal from "@/components/features/QuoteSelectionModal";
import clsx from "clsx";

interface BibleBook {
    id: string;
    name: string;
    chapters: number;
    order: number;
}

interface Lesson {
    id: string;
    title: string;
    content: string;
    book_id: string;
    verse_ref: string;
}

interface Fact {
    id: string;
    title: string;
    description: string;
    category: string; // Thematic category (e.g., "Geschichte")
    type: string;     // Media type (e.g., "text", "image")
    fact_kind?: string; // Content kind ("info", "word_study", "quote")
    word?: string;      // Target word for word_study
    verse_ref: string;
    book_id: string;
    chapter: number;
    verse_start: number;
    verse_end: number;
    lesson_id: string;
    file?: string;
    url?: string;
    author?: string;
    collectionId?: string;
}

const CATEGORIES = [
    { id: "text", label: "Text", icon: FileText },
    { id: "image", label: "Grafik", icon: ImageIcon },
    { id: "video", label: "Video", icon: Video },
    { id: "link", label: "Link", icon: ExternalLink },
    { id: "map", label: "Karte", icon: MapIcon },
];

interface InfosTabProps {
    mode?: 'info' | 'word_study' | 'quote' | 'text_study' | 'illustration';
}

export default function InfosTab({ mode = 'info' }: InfosTabProps) {
    const [facts, setFacts] = useState<Fact[]>([]);
    const [books, setBooks] = useState<BibleBook[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [activeWordStudyTab, setActiveWordStudyTab] = useState<'general' | 'lessons'>('general');
    const [activeTextStudyTab, setActiveTextStudyTab] = useState<'KI' | 'Andere' | 'Eigene'>('KI');
    const [activeIllustrationTab, setActiveIllustrationTab] = useState<'KI' | 'Andere' | 'Eigene'>('KI');

    const toggleGroup = (group: string) => {
        const newSet = new Set(expandedGroups);
        if (newSet.has(group)) {
            newSet.delete(group);
        } else {
            newSet.add(group);
        }
        setExpandedGroups(newSet);
    };

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "Allgemein",
        type: "text",
        word: "",
        url: "",
        has_bible_ref: false,
        book_id: "",
        chapter: 1,
        verse_start: 1,
        verse_end: 1,
        lesson_id: "",
        author: ""
    });

    // File upload state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [maxVerses, setMaxVerses] = useState(176);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Word selection state
    const [wordSelectorOpen, setWordSelectorOpen] = useState(false);
    const [wordSelectorText, setWordSelectorText] = useState("");
    const [wordSelectorLoading, setWordSelectorLoading] = useState(false);

    // AI Quote state
    const [quoteSelectorOpen, setQuoteSelectorOpen] = useState(false);

    // AI Generation state
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Filter by fact_kind. 
            // Older records without fact_kind are treated as "info"
            const filter = mode === 'info'
                ? 'fact_kind = "" || fact_kind = "info"'
                : `fact_kind = "${mode}"`;

            const [factsRes, booksRes, lessonsRes] = await Promise.all([
                pb.collection('facts').getFullList({
                    filter,
                    sort: 'category,title'
                }),
                pb.collection('bible_books').getFullList({ sort: 'order' }),
                pb.collection('lessons').getFullList({ sort: 'title' })
            ]);

            setFacts(factsRes.map(r => ({
                id: r.id,
                title: r.title || "",
                description: r.description || "",
                category: r.category || "Allgemein",
                type: r.type || "text",
                fact_kind: r.fact_kind || "info",
                word: r.word || "",
                verse_ref: r.verse_ref || "",
                book_id: r.book_id || "",
                chapter: r.chapter ?? 1,
                verse_start: r.verse_start ?? 1,
                verse_end: r.verse_end ?? 1,
                lesson_id: r.lesson_id || "",
                file: r.file || "",
                url: r.url || "",
                collectionId: r.collectionId
            })));

            setBooks(booksRes.map(r => ({
                id: r.id,
                name: r.name,
                chapters: r.chapter_count || 50,
                order: r.order || 0
            })));

            setLessons(lessonsRes.map(r => ({
                id: r.id,
                title: r.title || "(Ohne Titel)",
                content: r.content || "",
                book_id: r.book_id || r.book || "",
                verse_ref: r.verse_ref || ""
            })));
        } catch (e) {
            console.error("Failed to load data:", e);
        } finally {
            setLoading(false);
        }
    };

    const getSelectedBook = () => books.find(b => b.id === formData.book_id);

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

    const generateVerseRef = () => {
        if (!formData.has_bible_ref || !formData.book_id) return "";
        const book = getSelectedBook();
        if (!book) return "";

        // Check for whole book
        if (formData.chapter === 0) {
            return book.name;
        }

        // Check for whole chapter
        if (formData.verse_start === 0 && formData.verse_end === 0) {
            return `${book.name} ${formData.chapter}`;
        }

        const verseRange = formData.verse_start === formData.verse_end
            ? `${formData.verse_start}`
            : `${formData.verse_start}-${formData.verse_end}`;
        return `${book.name} ${formData.chapter}:${verseRange}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Use FormData for file upload
        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('category', formData.category);
        data.append('type', formData.type);
        data.append('fact_kind', mode);
        if (mode === 'word_study') {
            data.append('word', formData.word);
        }
        data.append('url', formData.url);
        data.append('lesson_id', formData.lesson_id || "");
        data.append('author', formData.author || "");

        if (selectedFile) {
            data.append('file', selectedFile);
        }

        if (formData.has_bible_ref && formData.book_id) {
            data.append('verse_ref', generateVerseRef());
            data.append('book_id', formData.book_id);
            // If chapter is 0 (whole book), store 0.
            data.append('chapter', formData.chapter.toString());
            data.append('verse_start', formData.chapter === 0 ? "0" : formData.verse_start.toString());
            data.append('verse_end', formData.chapter === 0 ? "0" : formData.verse_end.toString());
        } else {
            data.append('verse_ref', "");
            data.append('book_id', "");
            data.append('chapter', "0");
            data.append('verse_start', "0");
            data.append('verse_end', "0");
        }

        try {
            if (editingId) {
                await pb.collection('facts').update(editingId, data);
            } else {
                await pb.collection('facts').create(data);
            }
            resetForm();
            loadData();
        } catch (e: any) {
            console.error("Save error:", e);
            let msg = e.message;
            if (e.data?.data) {
                // Formatting validation errors nicely
                const details = Object.entries(e.data.data)
                    .map(([key, err]: [string, any]) => `${key}: ${err.message}`)
                    .join("\n");
                if (details) msg += `\n\nDetails:\n${details}`;
            }
            alert("Fehler beim Speichern:\n" + msg);
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            category: mode === 'word_study' ? "Wortstudie" : mode === 'quote' ? "Zitat" : (mode === 'text_study' || mode === 'illustration') ? "KI" : "Allgemein",
            type: "text",
            word: "",
            url: "",
            has_bible_ref: false,
            book_id: "",
            chapter: 1,
            verse_start: 1,
            verse_end: 1,
            lesson_id: "",
            author: ""
        });
        setSelectedFile(null);
        setShowForm(false);
        setEditingId(null);
    };

    const handleEdit = (fact: Fact) => {
        setFormData({
            title: fact.title,
            description: fact.description,
            category: fact.category || "Allgemein",
            type: fact.type || "text",
            word: fact.word || "",
            url: fact.url || "",
            has_bible_ref: !!fact.book_id,
            book_id: fact.book_id,
            chapter: fact.chapter,
            verse_start: fact.verse_start ?? 1,
            verse_end: fact.verse_end ?? 1,
            lesson_id: fact.lesson_id || "",
            author: fact.author || ""
        });
        setEditingId(fact.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Info wirklich löschen?")) return;
        try {
            await pb.collection('facts').delete(id);
            loadData();
        } catch (e: any) {
            alert("Fehler: " + e.message);
        }
    };

    // CSV Import is kept simple for now - mainly for text facts
    const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        const lines = text.split('\n').filter(l => l.trim());
        let imported = 0;
        for (let i = 1; i < lines.length; i++) {
            const [title, description, category, source] = lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
            if (title) {
                try {
                    // Map old categories if necessary or default to 'text'
                    const cat = CATEGORIES.some(c => c.id === category.toLowerCase()) ? category.toLowerCase() : "text"; // simplified mapping
                    await pb.collection('facts').create({ title, description, category: cat, source });
                    imported++;
                } catch (e) {
                    console.error(`Failed to import line ${i}:`, e);
                }
            }
        }
        alert(`${imported} Infos importiert!`);
        loadData();
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const compressImage = async (file: File): Promise<File> => {
        const MAX_SIZE = 1 * 1024 * 1024; // 1MB nominal limit
        // We target slightly less to be safe (e.g. 900KB)
        const SAFE_SIZE = 900 * 1024;

        if (file.size <= MAX_SIZE) return file;

        console.log(`Compressing image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                // Aggressive resize for 1MB limit: Max 1280px
                const MAX_DIM = 1280;
                if (width > height) {
                    if (width > MAX_DIM) {
                        height *= MAX_DIM / width;
                        width = MAX_DIM;
                    }
                } else {
                    if (height > MAX_DIM) {
                        width *= MAX_DIM / height;
                        height = MAX_DIM;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject(new Error("Canvas context not available"));
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);

                // Quality 0.6 should almost certainly yield < 500KB for 1280px
                canvas.toBlob((blob) => {
                    if (blob) {
                        const newFile = new File([blob], file.name, {
                            type: "image/jpeg",
                            lastModified: Date.now(),
                        });
                        console.log(`Compressed to: ${(newFile.size / 1024 / 1024).toFixed(2)} MB`);
                        resolve(newFile);
                    } else {
                        reject(new Error("Compression failed"));
                    }
                }, "image/jpeg", 0.6);
            };
            img.onerror = (err) => reject(err);
        });
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const processedFile = await compressImage(file);
                setSelectedFile(processedFile);
            } catch (err) {
                console.error("Compression error:", err);
                alert("Fehler beim Verarbeiten des Bildes. Bitte versuche ein kleineres Bild.");
            }
        } else {
            setSelectedFile(null);
        }
    };

    const handleOpenWordSelector = async () => {
        if (!formData.book_id || !formData.chapter) {
            alert("Bitte wähle zuerst ein Buch und Kapitel aus.");
            return;
        }

        setWordSelectorLoading(true);
        setWordSelectorOpen(true);
        setWordSelectorText("");

        try {
            const filter = `book="${formData.book_id}" && chapter=${formData.chapter} && verse >= ${formData.verse_start} && verse <= ${formData.verse_end}`;
            const records = await pb.collection('verses').getFullList({
                filter,
                sort: 'verse'
            });

            const text = records.map(r => r.text).join(" ");
            setWordSelectorText(text);
        } catch (e) {
            console.error("Error loading verses for word selector:", e);
            alert("Fehler beim Laden des Bibeltexts.");
            setWordSelectorOpen(false);
        } finally {
            setWordSelectorLoading(false);
        }
    };

    const handleGenerateAIStudy = async () => {
        if (!formData.word.trim()) {
            alert("Bitte gib zuerst ein Wort ein oder wähle eines aus.");
            return;
        }

        setAiLoading(true);
        try {
            const selectedBook = books.find(b => b.id === formData.book_id);
            const testament = selectedBook && selectedBook.order >= 40 ? 'NT' : 'OT';

            const res = await fetch('/api/word-meaning', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    word: formData.word,
                    context: formData.title || "Biblisches Wort",
                    testament
                })
            });

            if (!res.ok) throw new Error("KI-Analyse fehlgeschlagen");

            const data = await res.json();

            // Format AI response as Rich Text/HTML
            const formattedDescription = `
                <div class="space-y-4">
                    <div class="bg-zinc-50 dark:bg-slate-700/40 rounded-xl p-4 border border-zinc-100 dark:border-slate-600">
                        <p class="text-2xl font-serif mb-1">${data.originalWord || '—'}</p>
                        ${data.transliteration ? `<p class="text-sm text-zinc-500 italic">${data.transliteration}</p>` : ''}
                        ${data.strongNumber ? `<p class="text-xs text-indigo-500 mt-2 font-mono">Strong: ${data.strongNumber}</p>` : ''}
                    </div>
                    
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">Bedeutung</p>
                        <p>${data.meaning || '—'}</p>
                    </div>

                    ${data.rootMeaning ? `
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-purple-600 mb-2">Wortwurzel</p>
                        <p class="text-sm">${data.rootMeaning}</p>
                    </div>` : ''}

                    ${data.synonyms?.length ? `
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">Synonyme</p>
                        <div class="flex flex-wrap gap-2">
                            ${data.synonyms.map((s: string) => `<span class="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs">${s}</span>`).join('')}
                        </div>
                    </div>` : ''}

                    ${data.usage ? `
                    <div class="pt-2 border-t border-zinc-100 dark:border-slate-700">
                        <p class="text-xs text-zinc-500 italic"><span class="font-bold">Verwendung:</span> ${data.usage}</p>
                    </div>` : ''}
                </div>
            `.trim();

            setFormData(prev => ({
                ...prev,
                description: formattedDescription
            }));

        } catch (e: any) {
            console.error("AI Generation error:", e);
            alert("Fehler bei der KI-Generierung: " + e.message);
        } finally {
            setAiLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" /></div>;
    }

    const selectedBook = getSelectedBook();
    const CategoryIcon = CATEGORIES.find(c => c.id === formData.category)?.icon || FileText;

    return (
        <div className="space-y-4">
            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
                    title={mode === 'word_study' ? 'Neue Wortstudie' : mode === 'quote' ? 'Neues Zitat' : 'Neue Info'}
                >
                    <Plus size={20} />
                </button>
                <label
                    className="flex items-center justify-center w-10 h-10 bg-zinc-100 dark:bg-slate-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-slate-600 transition-colors cursor-pointer shrink-0"
                    title="CSV Import"
                >
                    <Upload size={20} />
                    <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleCSVImport} />
                </label>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-slate-800/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">
                                {editingId
                                    ? (mode === 'word_study' ? 'Wortstudie bearbeiten' : mode === 'quote' ? 'Zitat bearbeiten' : 'Info bearbeiten')
                                    : (mode === 'word_study' ? 'Neue Wortstudie' : mode === 'quote' ? 'Neues Zitat' : 'Neue Info')
                                }
                            </h3>
                            <button onClick={resetForm} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Type Selector (Only for general Info) */}
                            {mode === 'info' && (
                                <div>
                                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Medien-Typ</label>
                                    <div className="grid grid-cols-5 gap-2 mt-1">
                                        {CATEGORIES.map(cat => {
                                            const Icon = cat.icon;
                                            const isSelected = formData.type === cat.id;

                                            // Color logic for buttons
                                            let activeClass = "bg-zinc-600 text-white border-zinc-600 shadow-md";
                                            let inactiveClass = "bg-white dark:bg-slate-700 text-zinc-400 border-zinc-200 dark:border-slate-600 hover:bg-zinc-50 dark:hover:bg-slate-600";

                                            if (cat.id === 'image') {
                                                activeClass = "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20";
                                            } else if (cat.id === 'video') {
                                                activeClass = "bg-red-600 text-white border-red-600 shadow-md shadow-red-500/20";
                                            } else if (cat.id === 'map') {
                                                activeClass = "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20";
                                            } else if (cat.id === 'link') {
                                                activeClass = "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20";
                                            } else { // text / default
                                                activeClass = "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/20";
                                            }

                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, type: cat.id })}
                                                    className={`flex items-center justify-center p-3 rounded-xl border transition-all ${isSelected ? activeClass : inactiveClass}`}
                                                    title={cat.label}
                                                >
                                                    <Icon size={24} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Topics (Only for general Info) */}
                            {mode === 'info' && (
                                <div>
                                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Kategorie / Thema</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg"
                                    >
                                        <option value="Allgemein">Allgemein</option>
                                        <option value="Geschichte">Geschichte</option>
                                        <option value="Geografie">Geografie</option>
                                        <option value="Archäologie">Archäologie</option>
                                        <option value="Kultur">Kultur</option>
                                        <option value="Sprache">Sprache</option>
                                        <option value="Wissenschaft">Wissenschaft</option>
                                        <option value="Theologie">Theologie</option>
                                        <option value="Wortstudie">Wortstudie</option>
                                        <option value="Zitat">Zitat</option>
                                    </select>
                                </div>
                            )}

                            {/* Category selector for Text Study & Illustration */}
                            {(mode === 'text_study' || mode === 'illustration') && (
                                <div>
                                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Kategorie</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg"
                                    >
                                        <option value="KI">KI</option>
                                        <option value="Andere">Andere</option>
                                        <option value="Eigene">Eigene</option>
                                    </select>
                                </div>
                            )}

                            {/* Word field for word studies */}
                            {mode === 'word_study' && (
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Ziel-Wort *</label>
                                    </div>
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            required
                                            value={formData.word}
                                            onChange={e => setFormData({ ...formData, word: e.target.value })}
                                            className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg"
                                            placeholder="z.B. Glaube"
                                        />
                                        {formData.has_bible_ref && (
                                            <button
                                                type="button"
                                                onClick={handleOpenWordSelector}
                                                className="flex items-center gap-2 px-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shrink-0"
                                                title="Aus Bibeltext wählen"
                                            >
                                                <Search size={18} />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleGenerateAIStudy}
                                            disabled={aiLoading || !formData.word.trim()}
                                            className="flex items-center gap-2 px-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shrink-0 disabled:opacity-50"
                                            title="KI-Studie generieren"
                                        >
                                            {aiLoading ? (
                                                <div className="animate-spin w-4.5 h-4.5 border-2 border-emerald-500 border-t-transparent rounded-full" />
                                            ) : (
                                                <Sparkles size={18} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Dynamic Fields based on Type */}
                            {(formData.type === "image" || formData.type === "map") && (
                                <div className={`p-3 rounded-lg border ${formData.type === 'map' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800' : 'bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800'}`}>
                                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 block mb-2">{formData.type === 'map' ? 'Karte (Bild) hochladen' : 'Bild hochladen'}</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className={`w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${formData.type === 'map' ? 'file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-400' : 'file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-900/30 dark:file:text-purple-400'}`}
                                    />
                                </div>
                            )}

                            {(formData.type === "video" || formData.type === "link") && (
                                <div>
                                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">URL / Link</label>
                                    <div className="relative mt-1">
                                        <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                        <input
                                            type="url"
                                            value={formData.url}
                                            onChange={e => setFormData({ ...formData, url: e.target.value })}
                                            className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Title below category/dynamic fields, above Description */}
                            <div>
                                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Titel *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg"
                                />
                            </div>

                            {/* Author Field */}
                            <div>
                                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Verfasser / Quelle</label>
                                <div className="flex gap-2 mt-1">
                                    <input
                                        type="text"
                                        value={formData.author}
                                        onChange={e => setFormData({ ...formData, author: e.target.value })}
                                        className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg"
                                        placeholder="z.B. Martin Luther, KI, etc."
                                    />
                                    {mode === 'quote' && (
                                        <button
                                            type="button"
                                            onClick={() => setQuoteSelectorOpen(true)}
                                            className="flex items-center justify-center px-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shrink-0"
                                            title="KI Zitate vorschlagen"
                                        >
                                            <Sparkles size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Description (Rich Text) */}
                            <div>
                                <RichTextEditor
                                    label="Beschreibung / Inhalt"
                                    value={formData.description}
                                    onChange={(val: string) => setFormData({ ...formData, description: val })}
                                    placeholder="Inhalt beschreiben..."
                                    expandOnFocus={true}
                                />
                            </div>

                            {/* Bible Reference Toggle */}
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
                                    Mit Bibelvers verknüpfen
                                </label>
                            </div>

                            {/* Bible Reference Fields */}
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
                                            <div className="flex flex-wrap gap-4 p-3 bg-zinc-50 dark:bg-slate-700 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        id="wholeBook"
                                                        checked={formData.chapter === 0}
                                                        onChange={e => {
                                                            setFormData({
                                                                ...formData,
                                                                chapter: e.target.checked ? 0 : 1,
                                                                verse_start: e.target.checked ? 0 : 1,
                                                                verse_end: e.target.checked ? 0 : 1
                                                            });
                                                        }}
                                                        className="w-5 h-5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <label htmlFor="wholeBook" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2 cursor-pointer">
                                                        Ganzes Buch
                                                    </label>
                                                </div>

                                                {formData.chapter !== 0 && (
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            id="wholeChapter"
                                                            checked={formData.verse_start === 0}
                                                            onChange={e => {
                                                                setFormData({
                                                                    ...formData,
                                                                    verse_start: e.target.checked ? 0 : 1,
                                                                    verse_end: e.target.checked ? 0 : 1
                                                                });
                                                            }}
                                                            className="w-5 h-5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <label htmlFor="wholeChapter" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2 cursor-pointer">
                                                            Ganzes Kapitel
                                                        </label>
                                                    </div>
                                                )}
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
                                                    {formData.verse_start !== 0 && (
                                                        <>
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

                            {/* Link to Lesson */}
                            <div className="p-3 bg-zinc-50 dark:bg-slate-700/50 rounded-lg border border-zinc-200 dark:border-slate-600">
                                <div className="flex items-center gap-2 mb-2">
                                    <Link size={16} className="text-zinc-500" />
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Mit Lektion verknüpfen</label>
                                </div>
                                <select
                                    value={formData.lesson_id}
                                    onChange={e => setFormData({ ...formData, lesson_id: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-lg"
                                >
                                    <option value="">Keine Verknüpfung</option>
                                    {lessons.map(l => (
                                        <option key={l.id} value={l.id}>{l.title}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={!formData.title.trim()}
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
                                title="Speichern"
                            >
                                <Save size={24} />
                            </button>
                        </form>
                    </div>
                </div >
            )
            }

            {/* List */}
            {
                facts.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 bg-zinc-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-zinc-200 dark:border-slate-700">
                        <p className="text-4xl mb-2">
                            {mode === 'word_study' ? "📝" : mode === 'quote' ? "💬" : "💡"}
                        </p>
                        <p>Noch keine {mode === 'word_study' ? 'Wortstudien' : mode === 'quote' ? 'Zitate' : 'Infos'} vorhanden.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Word Study Tabs */}
                        {mode === 'word_study' && (
                            <div className="flex p-1 bg-zinc-100 dark:bg-slate-800/80 rounded-xl border border-zinc-200 dark:border-slate-700">
                                <button
                                    onClick={() => setActiveWordStudyTab('general')}
                                    className={clsx(
                                        "flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                                        activeWordStudyTab === 'general'
                                            ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                    )}
                                >
                                    Allgemein
                                </button>
                                <button
                                    onClick={() => setActiveWordStudyTab('lessons')}
                                    className={clsx(
                                        "flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                                        activeWordStudyTab === 'lessons'
                                            ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                    )}
                                >
                                    Textbezogen
                                </button>
                            </div>
                        )}

                        {/* Text Study & Illustration Tabs */}
                        {(mode === 'text_study' || mode === 'illustration') && (
                            <div className="flex p-1 bg-zinc-100 dark:bg-slate-800/80 rounded-xl border border-zinc-200 dark:border-slate-700">
                                {[
                                    { id: 'KI', label: 'KI' },
                                    { id: 'Andere', label: 'Andere' },
                                    { id: 'Eigene', label: 'Eigene' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => mode === 'text_study' ? setActiveTextStudyTab(tab.id as any) : setActiveIllustrationTab(tab.id as any)}
                                        className={clsx(
                                            "flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                                            (mode === 'text_study' ? activeTextStudyTab === tab.id : activeIllustrationTab === tab.id)
                                                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {(() => {
                            // Filter by selected tab if in word study mode or text study / illustration
                            const filteredFacts = mode === 'word_study'
                                ? facts.filter(f => activeWordStudyTab === 'lessons' ? !!f.lesson_id : !f.lesson_id)
                                : mode === 'text_study'
                                    ? facts.filter(f => f.category === activeTextStudyTab)
                                    : mode === 'illustration'
                                        ? facts.filter(f => f.category === activeIllustrationTab)
                                        : facts;

                            if (filteredFacts.length === 0) {
                                return (
                                    <div className="text-center py-12 text-zinc-500 bg-zinc-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-zinc-200 dark:border-slate-700">
                                        <p className="text-sm">Keine Einträge in dieser Kategorie.</p>
                                    </div>
                                );
                            }

                            // 1. Group by Book (or "Allgemein" / "Ohne Buch")
                            type BookGroup = {
                                id: string;
                                title: string;
                                order: number;
                                factCount: number;
                                subgroups: Map<string, Fact[]>; // lesson_title -> facts
                            };

                            const bookGroups = new Map<string, BookGroup>();

                            filteredFacts.forEach(fact => {
                                let bookId = "general";
                                let bookTitle = "Allgemeine Infos";
                                let bookOrder = 9999;
                                let subgroupTitle = "Allgemeine Infos";

                                // Determine Book & Subgroup
                                if (mode === 'word_study' && activeWordStudyTab === 'general' && fact.word) {
                                    // Alphabetical grouping for General Word Studies
                                    const firstChar = fact.word.trim().charAt(0).toUpperCase();
                                    bookId = `alpha-${firstChar}`;
                                    bookTitle = firstChar;
                                    bookOrder = firstChar.charCodeAt(0);
                                    subgroupTitle = ""; // Signal flat list (no nested toggle)
                                } else if (fact.lesson_id) {
                                    const lesson = lessons.find(l => l.id === fact.lesson_id);
                                    if (lesson && lesson.book_id) {
                                        const book = books.find(b => b.id === lesson.book_id);
                                        if (book) {
                                            bookId = book.id;
                                            bookTitle = book.name;
                                            bookOrder = book.order || 0;
                                            subgroupTitle = lesson.title;
                                        }
                                    } else if (lesson) {
                                        // Lesson without book (Thema)
                                        bookId = "thema";
                                        bookTitle = "Thematische Lektionen";
                                        bookOrder = 5000;
                                        subgroupTitle = lesson.title;
                                    }
                                } else if (fact.book_id) {
                                    // General fact with Bible ref
                                    const book = books.find(b => b.id === fact.book_id);
                                    if (book) {
                                        bookId = book.id;
                                        bookTitle = book.name;
                                        bookOrder = book.order || 0;
                                        subgroupTitle = mode === 'text_study' ? "" : "Allgemeine Infos zum Buch";
                                    }
                                }

                                // Initialize Book Group
                                if (!bookGroups.has(bookId)) {
                                    bookGroups.set(bookId, {
                                        id: bookId,
                                        title: bookTitle,
                                        order: bookOrder,
                                        factCount: 0,
                                        subgroups: new Map()
                                    });
                                }

                                const group = bookGroups.get(bookId)!;
                                group.factCount++;

                                // Add to Subgroup
                                if (!group.subgroups.has(subgroupTitle)) {
                                    group.subgroups.set(subgroupTitle, []);
                                }
                                group.subgroups.get(subgroupTitle)?.push(fact);
                            });

                            // Sort Book Groups
                            const sortedBookGroups = Array.from(bookGroups.values()).sort((a, b) => a.order - b.order);

                            return sortedBookGroups.map(bookGroup => {
                                const isBookSection = bookGroup.id !== "general" && bookGroup.id !== "thema";
                                const isExpanded = expandedGroups.has(bookGroup.id);

                                // Sort subgroups
                                const sortedSubgroups = Array.from(bookGroup.subgroups.entries()).sort((a, b) => {
                                    if (a[0] === "Allgemeine Infos zum Buch") return 1;
                                    if (b[0] === "Allgemeine Infos zum Buch") return -1;
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
                                                <span className="text-zinc-400 text-xs font-normal">({bookGroup.factCount})</span>
                                            </div>
                                            {isExpanded ? <ChevronDown size={20} className="text-zinc-400" /> : <ChevronRight size={20} className="text-zinc-400" />}
                                        </button>

                                        {isExpanded && (
                                            <div className="p-3 pt-0 space-y-4 border-t border-zinc-200 dark:border-zinc-800">
                                                {sortedSubgroups.map(([subgroupTitle, groupFacts], idx) => {
                                                    const isLast = idx === sortedSubgroups.length - 1;
                                                    // Unique key for collapsing logic (combine bookId and subgroupTitle)
                                                    const collapseKey = `${bookGroup.id}-${subgroupTitle}`;
                                                    const isSubExpanded = expandedGroups.has(collapseKey) || !subgroupTitle; // Always expanded if no title (flat list)

                                                    return (
                                                        <div key={subgroupTitle} className={!isLast ? "border-b border-zinc-200 dark:border-slate-700 pb-4" : ""}>
                                                            {subgroupTitle && (
                                                                <button
                                                                    onClick={() => toggleGroup(collapseKey)}
                                                                    className="w-full flex items-center justify-between py-2 group"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-300 transition-colors text-left">
                                                                            {subgroupTitle}
                                                                        </h4>
                                                                        <span className="text-zinc-400 text-[10px] font-normal">({groupFacts.length})</span>
                                                                    </div>
                                                                    {isSubExpanded ?
                                                                        <ChevronDown size={16} className="text-zinc-300 group-hover:text-zinc-500" /> :
                                                                        <ChevronRight size={16} className="text-zinc-300 group-hover:text-zinc-500" />
                                                                    }
                                                                </button>
                                                            )}

                                                            {isSubExpanded && (
                                                                <div className="space-y-2 mt-1">
                                                                    {groupFacts.map(fact => {
                                                                        const TypeLabel = CATEGORIES.find(c => c.id === fact.type)?.label || "Text";
                                                                        const TypeIcon = CATEGORIES.find(c => c.id === fact.type)?.icon || FileText;

                                                                        const colorClass = fact.type === 'image' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' :
                                                                            fact.type === 'video' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' :
                                                                                fact.type === 'map' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                                                                                    fact.type === 'link' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                                                                                        'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300';

                                                                        return (
                                                                            <div key={fact.id} className="bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-lg p-3 flex justify-between items-start gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="flex flex-wrap gap-2 mb-1">
                                                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide flex items-center gap-1 ${colorClass}`}>
                                                                                            <TypeIcon size={10} />
                                                                                            {TypeLabel}
                                                                                        </span>
                                                                                        {fact.word && (
                                                                                            <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/40 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                                                                                                Wort: {fact.word}
                                                                                            </span>
                                                                                        )}
                                                                                        {fact.category && (
                                                                                            <span className="text-[10px] font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                                                                                                {fact.category}
                                                                                            </span>
                                                                                        )}
                                                                                        {fact.author && (
                                                                                            <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700/50 px-1.5 py-0.5 rounded-md uppercase tracking-wide flex items-center gap-1">
                                                                                                <User size={10} />
                                                                                                {fact.author}
                                                                                            </span>
                                                                                        )}
                                                                                        {fact.verse_ref && (
                                                                                            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                                                                                <BookOpen size={10} /> {fact.verse_ref}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <h4 className="font-semibold text-zinc-900 dark:text-white text-sm">{fact.title}</h4>
                                                                                    {fact.description && (
                                                                                        <div className="text-xs text-zinc-500 mt-1 line-clamp-1">
                                                                                            {fact.description
                                                                                                .replace(/<[^>]*>?/gm, ' ')
                                                                                                .replace(/\[\/?(justify|hyphen|center|left|right)\]/g, '')
                                                                                                .trim()}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex gap-1 shrink-0">
                                                                                    <button
                                                                                        onClick={() => handleEdit(fact)}
                                                                                        className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                                                                        title="Bearbeiten"
                                                                                    >
                                                                                        <Edit size={14} />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleDelete(fact.id)}
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
                )
            }

            {/* Question Detail Modal (exists below, adding our modal) */}
            <QuoteSelectionModal
                isOpen={quoteSelectorOpen}
                onClose={() => setQuoteSelectorOpen(false)}
                topic={formData.title}
                bibleRef={formData.has_bible_ref ? generateVerseRef() : undefined}
                lessonContext={formData.lesson_id ? (() => {
                    const l = lessons.find(lx => lx.id === formData.lesson_id);
                    return l ? `${l.title}: ${l.content.replace(/<[^>]*>?/gm, ' ')}` : undefined;
                })() : undefined}
                onSelect={(quote) => {
                    setFormData(prev => ({
                        ...prev,
                        description: quote.text,
                        author: quote.author
                    }));
                }}
            />

            {/* Word Selection Modal */}
            {
                wordSelectorOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg">Wort aus Bibeltext wählen</h3>
                                <button onClick={() => setWordSelectorOpen(false)} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button>
                            </div>

                            <div className="bg-zinc-50 dark:bg-slate-700/50 rounded-xl p-4 border border-zinc-200 dark:border-slate-600 max-h-[60vh] overflow-y-auto">
                                {wordSelectorLoading ? (
                                    <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" /></div>
                                ) : wordSelectorText ? (
                                    <div className="flex flex-wrap gap-x-1 gap-y-2 leading-relaxed text-lg">
                                        {wordSelectorText.split(/(\s+)/g).map((chunk, i) => {
                                            if (/^\s+$/.test(chunk)) return <span key={i}>{chunk}</span>;
                                            const clean = chunk.replace(/[.,;!?"'()\[\]]/g, '').trim();
                                            if (!clean) return <span key={i}>{chunk}</span>;

                                            return (
                                                <span
                                                    key={i}
                                                    onClick={() => {
                                                        setFormData({ ...formData, word: clean, title: `Wortstudie: ${clean}` });
                                                        setWordSelectorOpen(false);
                                                    }}
                                                    className="cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-600 dark:hover:text-indigo-300 rounded px-1 transition-colors border-b border-transparent hover:border-indigo-400"
                                                >
                                                    {chunk}
                                                </span>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-center text-zinc-500 italic">Kein Text verfügbar.</p>
                                )}
                            </div>
                            <p className="text-xs text-zinc-400 mt-4 text-center">Klicke auf ein Wort, um es als Ziel für die Wortstudie zu übernehmen.</p>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
