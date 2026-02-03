"use client";

import { useState, useEffect, useRef } from "react";
import { pb } from "@/lib/pocketbase";
import Link from "next/link";
import { ChevronLeft, FileText, Lightbulb, Image as ImageIcon, Video, ExternalLink, Map as MapIcon, BookOpen, HelpCircle, StickyNote, Plus, X, Save, Trash2, Edit, Brain, GraduationCap, Trophy, ChevronRight, Languages, Quote } from "lucide-react";
import RichTextDisplay from "@/components/ui/RichTextDisplay";
import WordMeaningPopup from "@/components/features/WordMeaningPopup";
import QuizOverlay from "@/components/features/QuizOverlay";
import clsx from "clsx";

const TYPE_ICONS: Record<string, any> = {
    text: FileText,
    image: ImageIcon,
    video: Video,
    link: ExternalLink,
    map: MapIcon,
    word_study: Languages,
    quote: Quote
};

const TYPE_STYLES: Record<string, { bg: string, border: string, text: string, hover: string, badge: string, solidBg: string, hoverBg: string }> = {
    image: { bg: 'bg-purple-50 dark:bg-slate-800/50', border: 'border-purple-200 dark:border-purple-800/50', text: 'text-purple-600 dark:text-purple-400', hover: 'hover:border-purple-400', badge: 'bg-purple-100 dark:bg-purple-900/40', solidBg: 'bg-purple-600', hoverBg: 'hover:bg-purple-700' },
    video: { bg: 'bg-red-50 dark:bg-slate-800/50', border: 'border-red-200 dark:border-red-800/50', text: 'text-red-600 dark:text-red-400', hover: 'hover:border-red-400', badge: 'bg-red-100 dark:bg-red-900/40', solidBg: 'bg-red-600', hoverBg: 'hover:bg-red-700' },
    map: { bg: 'bg-emerald-50 dark:bg-slate-800/50', border: 'border-emerald-200 dark:border-emerald-800/50', text: 'text-emerald-600 dark:text-emerald-400', hover: 'hover:border-emerald-400', badge: 'bg-emerald-100 dark:bg-emerald-900/40', solidBg: 'bg-emerald-600', hoverBg: 'hover:bg-emerald-700' },
    link: { bg: 'bg-blue-50 dark:bg-slate-800/50', border: 'border-blue-200 dark:border-blue-800/50', text: 'text-blue-600 dark:text-blue-400', hover: 'hover:border-blue-400', badge: 'bg-blue-100 dark:bg-blue-900/40', solidBg: 'bg-blue-600', hoverBg: 'hover:bg-blue-700' },
    text: { bg: 'bg-amber-50 dark:bg-slate-800/50', border: 'border-amber-200 dark:border-amber-800/50', text: 'text-amber-600 dark:text-amber-400', hover: 'hover:border-amber-400', badge: 'bg-amber-100 dark:bg-amber-900/40', solidBg: 'bg-amber-500', hoverBg: 'hover:bg-amber-600' }
};

function UnifiedContentList({ facts, questions, onSelectFact, onSelectQuestion }: any) {
    const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });
    const combined = [
        ...facts.map((f: any) => ({ ...f, _type: 'fact' as const })),
        ...questions.map((q: any) => ({ ...q, _type: 'question' as const }))
    ].sort((a: any, b: any) => {
        if (a._type === 'question' && b._type === 'question') {
            return collator.compare(a.question, b.question);
        }
        return (a.order || 0) - (b.order || 0);
    });

    if (combined.length === 0) return (
        <div className="text-center py-12 bg-zinc-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-zinc-200 dark:border-slate-700">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-zinc-300" />
            <p className="text-zinc-500 text-sm">Noch keine Inhalte für diese Lektion verfügbar.</p>
        </div>
    );

    return (
        <div className="space-y-4">
            {combined.map((item: any) => {
                if (item._type === 'fact') {
                    const Icon = TYPE_ICONS[item.fact_kind] || TYPE_ICONS[item.type] || FileText;
                    const style = TYPE_STYLES[item.type] || TYPE_STYLES.text;
                    const label = item.fact_kind === 'word_study' ? 'Wortstudie' : item.fact_kind === 'quote' ? 'Zitat' : 'Info';
                    return (
                        <div key={item.id} className={`${style.bg} border ${style.border} rounded-xl p-4 shadow-sm group ${style.hover} transition-all cursor-pointer`} onClick={() => onSelectFact(item)}>
                            <div className={`flex items-center gap-2 ${style.text} mb-2`}>
                                <Icon size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-90">{label}</span>
                                {item.category && <span className={`text-[10px] ${style.badge} px-2 py-0.5 rounded-full`}>{item.category}</span>}
                                {item.word && <span className="text-[10px] font-bold bg-white/50 px-2 py-0.5 rounded-full">Wort: {item.word}</span>}
                            </div>
                            <h4 className="font-bold text-zinc-800 dark:text-zinc-200">{item.title}</h4>
                            <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-2">
                                <RichTextDisplay content={item.description} />
                            </div>
                        </div>
                    );
                } else {
                    return (
                        <div key={item.id} className="bg-emerald-50/50 dark:bg-slate-800/50 border border-emerald-100 dark:border-slate-700 rounded-xl p-4 shadow-sm group hover:border-emerald-400 transition-all cursor-pointer" onClick={() => onSelectQuestion(item)}>
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                                <HelpCircle size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Frage</span>
                            </div>
                            <h4 className="font-medium text-zinc-800 dark:text-zinc-200">{item.question}</h4>
                            {item.is_answered && (
                                <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Beantwortet
                                </div>
                            )}
                        </div>
                    );
                }
            })}
        </div>
    );
}

interface Lesson {
    id: string;
    title: string;
    content: string;
    category: string;
    verse_ref: string;
    book_id: string;
    chapter_start: number;
    verse_start: number;
    verse_end: number;
    has_bible_ref: boolean;
    expand?: {
        book_id?: {
            name: string;
            order: number;
        };
    };
}

interface Fact {
    id: string;
    title: string;
    description: string;
    category: string;
    type: string;
    fact_kind?: string;
    word?: string;
    verse_start: number;
    verse_end: number;
    lesson_id: string;
    order: number;
    url?: string;
    file?: string;
    collectionId?: string;
}

interface Verse {
    id: string;
    verse: number;
    text: string;
}

interface Question {
    id: string;
    question: string;
    category: string;
    lesson_id: string;
    verse_start: number;
    verse_end: number;
    answer: string;
    is_answered: boolean;
}

interface Note {
    id: string;
    content: string;
    lesson_id: string;
    verse_start: number;
    verse_end: number;
    created: string;
}

function TitleMarquee({ title }: { title: string }) {
    const [shouldMarquee, setShouldMarquee] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        const checkOverflow = () => {
            if (containerRef.current && textRef.current) {
                // scrollWidth is the real width of the content
                // clientWidth is the width of the visible container
                const isOverflowing = textRef.current.scrollWidth > containerRef.current.clientWidth;
                setShouldMarquee(isOverflowing);
            }
        };

        // Check after a short delay to ensure font loading and layout are ready
        const timer = setTimeout(checkOverflow, 150);
        window.addEventListener('resize', checkOverflow);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', checkOverflow);
        };
    }, [title]);

    return (
        <div ref={containerRef} className="marquee-container w-full relative">
            <h1
                ref={textRef}
                className={clsx(
                    "text-lg font-bold whitespace-nowrap",
                    shouldMarquee ? "animate-marquee" : "truncate"
                )}
            >
                {title}{shouldMarquee ? ` \u00A0\u00A0\u00A0\u00A0 ${title} \u00A0\u00A0\u00A0\u00A0 ` : ""}
            </h1>
        </div>
    );
}

export default function LessonDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;

    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [facts, setFacts] = useState<Fact[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [verses, setVerses] = useState<Verse[]>([]);
    const [memoryVerses, setMemoryVerses] = useState<any[]>([]);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
    const [showMemoryVerseModal, setShowMemoryVerseModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedFact, setSelectedFact] = useState<Fact | null>(null);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [noteContent, setNoteContent] = useState("");
    const [savingNote, setSavingNote] = useState(false);
    const [selectedWord, setSelectedWord] = useState<string | null>(null);

    useEffect(() => {
        loadLessonData();
    }, [id]);

    const loadLessonData = async () => {
        setLoading(true);
        try {
            const lessonRes = await pb.collection('lessons').getOne(id, {
                expand: 'book_id'
            });

            // Load other data in parallel, handling failures gracefully
            const [factsRes, questionsRes, memoryVersesRes, quizzesRes, notesRes] = await Promise.all([
                pb.collection('facts').getFullList({ filter: `lesson_id="${id}"`, sort: 'order' }).catch(() => []),
                pb.collection('questions').getFullList({ filter: `lesson_id="${id}"`, sort: 'question' }).catch(() => []),
                pb.collection('memory_verses').getFullList({ filter: `lesson_id="${id}"`, expand: 'book_id', sort: 'created' }).catch(() => []),
                pb.collection('quizzes').getFullList({ filter: `lesson_id="${id}"` }).catch(() => []),
                pb.collection('notes').getFullList({ filter: `lesson_id="${id}"`, sort: '-created' }).catch(() => [])
            ]);

            const loadedLesson: Lesson = {
                id: lessonRes.id,
                title: lessonRes.title || "",
                content: lessonRes.content || "",
                category: lessonRes.category || "",
                verse_ref: lessonRes.verse_ref || "",
                book_id: lessonRes.book_id || "",
                chapter_start: lessonRes.chapter_start ?? 0,
                verse_start: lessonRes.verse_start ?? 0,
                verse_end: lessonRes.verse_end ?? 0,
                has_bible_ref: !!lessonRes.book_id,
                expand: lessonRes.expand
            };

            setLesson(loadedLesson);
            setFacts(factsRes.map(r => ({
                id: r.id,
                title: r.title || "Info",
                description: r.description || "",
                category: r.category || "",
                type: r.type || "text",
                fact_kind: r.fact_kind,
                word: r.word,
                verse_start: r.verse_start || 0,
                verse_end: r.verse_end || 0,
                lesson_id: r.lesson_id || "",
                order: r.order || 0,
                url: r.url || "",
                file: r.file || "",
                collectionId: r.collectionId
            })));

            setMemoryVerses(memoryVersesRes.map(r => ({
                id: r.id,
                text: r.text,
                reference: `${r.expand?.book_id?.name || ""} ${r.chapter}:${r.verse_start}${r.verse_end > r.verse_start ? `-${r.verse_end}` : ""}`
            })));

            setQuizzes(quizzesRes.map(r => ({
                id: r.id,
                title: r.title,
                questions: r.questions
            })));

            const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });
            setQuestions(questionsRes.map(r => ({
                id: r.id,
                question: r.question || "",
                category: r.category || "allgemein",
                lesson_id: r.lesson_id || "",
                verse_start: r.verse_start || 0,
                verse_end: r.verse_end || 0,
                answer: r.answer || "",
                is_answered: r.is_answered || false,
                order: r.order || 0
            })).sort((a, b) => collator.compare(a.question, b.question)));

            setNotes(notesRes.map(r => ({
                id: r.id,
                content: r.content || "",
                lesson_id: r.lesson_id || "",
                verse_start: r.verse_start || 0,
                verse_end: r.verse_end || 0,
                created: r.created || ""
            })));

            // Load Bible Verses if applicable
            if (loadedLesson.has_bible_ref && loadedLesson.book_id && loadedLesson.category !== "Thema") {
                await loadVerses(loadedLesson);
            }

        } catch (e) {
            console.error("Failed to load lesson:", e);
        } finally {
            setLoading(false);
        }
    };

    const loadVerses = async (lesson: Lesson) => {
        try {
            const records = await pb.collection('verses').getList(1, 200, {
                filter: `book="${lesson.book_id}" && chapter=${lesson.chapter_start} && verse>=${lesson.verse_start} && verse<=${lesson.verse_end}`,
                sort: 'verse'
            });
            setVerses(records.items.map(r => ({
                id: r.id,
                verse: r.verse,
                text: r.text
            })));
        } catch (e) {
            console.error("Failed to load verses:", e);
        }
    };

    const handleSaveNote = async () => {
        if (!noteContent.trim() || !lesson) return;
        setSavingNote(true);
        try {
            if (editingNote) {
                await pb.collection('notes').update(editingNote.id, { content: noteContent });
            } else {
                await pb.collection('notes').create({
                    content: noteContent,
                    lesson_id: lesson.id,
                    verse_start: 0,
                    verse_end: 0
                });
            }
            setShowNoteModal(false);
            setNoteContent("");
            setEditingNote(null);
            loadLessonData();
        } catch (e: any) {
            console.error("Failed to save note:", e);
            alert("Fehler beim Speichern: " + e.message);
        } finally {
            setSavingNote(false);
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!confirm("Notiz wirklich löschen?")) return;
        try {
            await pb.collection('notes').delete(noteId);
            loadLessonData();
        } catch (e: any) {
            alert("Fehler: " + e.message);
        }
    };

    const openEditNote = (note: Note) => {
        setEditingNote(note);
        setNoteContent(note.content);
        setShowNoteModal(true);
    };

    const openNewNote = () => {
        setEditingNote(null);
        setNoteContent("");
        setShowNoteModal(true);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
                <p className="text-xl text-zinc-500">Lektion nicht gefunden.</p>
                <Link href="/study" className="text-indigo-600 hover:underline">Zurück zur Übersicht</Link>
            </div>
        );
    }

    const isThema = lesson.category === "Thema";
    const hasBibleRef = !!lesson.book_id && !isThema;

    return (
        <div className="min-h-screen pb-24 bg-white dark:bg-background">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white dark:bg-background px-4 py-4 flex items-center gap-4">
                <Link href="/study" className="p-2 -ml-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    <ChevronLeft size={24} />
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${isThema
                            ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30"
                            : "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30"
                            }`}>
                            {lesson.category}
                        </span>
                        {facts.length > 0 && (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <Lightbulb size={10} /> {facts.length}
                            </span>
                        )}
                        {memoryVerses.length > 0 && (
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                <Brain size={10} /> {memoryVerses.length}
                            </span>
                        )}
                        {questions.filter(q => q.category === "bibeltext").length > 0 && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <HelpCircle size={10} /> {questions.filter(q => q.category === "bibeltext").length}
                            </span>
                        )}
                        {quizzes.length > 0 && (
                            <span className="text-[10px] font-bold text-fuchsia-600 dark:text-fuchsia-400 flex items-center gap-1">
                                <GraduationCap size={10} /> {quizzes.length}
                            </span>
                        )}
                    </div>
                    <TitleMarquee title={lesson.title} />
                </div>

                {memoryVerses.length > 0 && (
                    <button
                        onClick={() => setShowMemoryVerseModal(true)}
                        className="p-2.5 bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 hover:scale-105 transition-all"
                        title="Lernvers anzeigen"
                    >
                        <Brain size={20} />
                    </button>
                )}
            </header>

            {/* Memory Verse Modal */}
            {showMemoryVerseModal && (
                <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowMemoryVerseModal(false)}>
                    <div className="bg-indigo-900 border border-indigo-700/50 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-4 right-4 text-indigo-300">
                            <Brain size={24} className="opacity-20 transform scale-[3]" />
                        </div>
                        <h3 className="text-indigo-200 font-bold uppercase text-xs tracking-widest mb-4">Lernvers</h3>

                        <div className="space-y-6">
                            {memoryVerses.map((mv, idx) => (
                                <div key={mv.id} className="relative z-10">
                                    <p className="text-xl md:text-2xl font-serif text-white leading-relaxed italic mb-3">
                                        "{mv.text}"
                                    </p>
                                    <p className="text-right font-bold text-indigo-300">
                                        — {mv.reference}
                                    </p>
                                    {idx < memoryVerses.length - 1 && <div className="h-px bg-indigo-800/50 my-6" />}
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowMemoryVerseModal(false)}
                            className="mt-8 w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors border border-white/5"
                        >
                            Schließen
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-prose mx-auto px-4 py-4">
                {/* Fact Detail Popup */}
                {selectedFact && (() => {
                    const style = TYPE_STYLES[selectedFact.type] || TYPE_STYLES.text;
                    const Icon = TYPE_ICONS[selectedFact.type] || Lightbulb;

                    return (
                        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedFact(null)}>
                            <div className={`${style.bg} rounded-2xl p-6 w-full max-w-lg shadow-xl border-2 ${style.border} flex flex-col max-h-[80vh]`} onClick={e => e.stopPropagation()}>
                                <div className={`flex items-center gap-2 ${style.text} mb-4 border-b-2 border-inherit/20 pb-3 shrink-0`}>
                                    <Icon className="w-5 h-5" />
                                    <span className="font-bold uppercase text-[10px] tracking-widest">Information</span>
                                    {selectedFact.category && (
                                        <span className={`text-[10px] font-bold ${style.badge} px-2 py-0.5 rounded-full`}>{selectedFact.category}</span>
                                    )}
                                </div>
                                <h3 className="font-bold text-lg mb-2 shrink-0">{selectedFact.title}</h3>

                                <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0 text-zinc-700 dark:text-zinc-300 pr-2">
                                    {selectedFact.type === 'image' && selectedFact.file && (
                                        <div className="mb-4 rounded-xl overflow-hidden border border-zinc-200 dark:border-slate-700 bg-zinc-100 dark:bg-slate-900">
                                            <img
                                                src={`${pb.baseUrl}/api/files/${selectedFact.collectionId}/${selectedFact.id}/${selectedFact.file}`}
                                                alt={selectedFact.title}
                                                className="w-full h-auto object-contain max-h-[40vh]"
                                            />
                                        </div>
                                    )}
                                    <RichTextDisplay content={selectedFact.description || "Keine Beschreibung."} />
                                </div>

                                {/* Media Link */}
                                {selectedFact.url && (() => {
                                    const style = TYPE_STYLES[selectedFact.type] || TYPE_STYLES.text;
                                    const Icon = TYPE_ICONS[selectedFact.type] || ExternalLink;
                                    // Map technical type to readable label for the button
                                    const label = selectedFact.type === 'video' ? "Video öffnen" :
                                        selectedFact.type === 'map' ? "Karte öffnen" :
                                            selectedFact.type === 'link' ? "Link öffnen" : "Öffnen";

                                    return (
                                        <a
                                            href={selectedFact.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 text-sm border-2 ${style.bg} ${style.border} ${style.text} ${style.hover.replace('hover:', 'hover:bg-')}`}
                                        >
                                            <Icon size={18} />
                                            {label}
                                        </a>
                                    );
                                })()}

                                {selectedFact.file && (() => {
                                    const style = TYPE_STYLES.image;
                                    return (
                                        <a
                                            href={`${pb.baseUrl}/api/files/${selectedFact.collectionId}/${selectedFact.id}/${selectedFact.file}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 text-sm border-2 ${style.bg} ${style.border} ${style.text} ${style.hover.replace('hover:', 'hover:bg-')}`}
                                        >
                                            <ImageIcon size={18} />
                                            Datei öffnen
                                        </a>
                                    );
                                })()}

                                <button
                                    onClick={() => setSelectedFact(null)}
                                    className={`mt-4 w-full py-3 ${style.solidBg} ${style.hoverBg} text-white rounded-xl font-bold shrink-0 transition-all shadow-md active:scale-[0.98]`}
                                >
                                    Schließen
                                </button>
                            </div>
                        </div>
                    )
                })()}

                {/* Question Detail Popup */}
                {selectedQuestion && (
                    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setSelectedQuestion(null)}>
                        <div className="bg-emerald-50 dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-xl border-2 border-emerald-400 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-3 shrink-0">
                                <HelpCircle className="w-5 h-5" />
                                <span className="font-bold">Frage</span>
                                {selectedQuestion.verse_start > 0 && (
                                    <span className="text-xs bg-emerald-200 dark:bg-emerald-800 px-2 py-0.5 rounded-full">
                                        V. {selectedQuestion.verse_start}{selectedQuestion.verse_end > selectedQuestion.verse_start ? `-${selectedQuestion.verse_end}` : ""}
                                    </span>
                                )}
                            </div>
                            <p className="font-medium text-lg mb-4 shrink-0">{selectedQuestion.question}</p>

                            {selectedQuestion.answer ? (
                                <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0 text-zinc-700 dark:text-zinc-300 pr-2">
                                    <div className="text-xs uppercase font-bold text-emerald-600 mb-2">Antwort</div>
                                    <RichTextDisplay content={selectedQuestion.answer} />
                                </div>
                            ) : (
                                <div className="flex-1 text-center py-4 text-zinc-400">
                                    <p className="italic">Diese Frage wurde noch nicht beantwortet.</p>
                                </div>
                            )}

                            <button
                                onClick={() => setSelectedQuestion(null)}
                                className="mt-4 w-full py-2 bg-emerald-500 text-white rounded-lg font-medium shrink-0 hover:bg-emerald-600 transition-colors"
                            >
                                Schließen
                            </button>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="space-y-4">
                    {/* Thema: Show description and then sorted list of items */}
                    {isThema && (
                        <div className="space-y-4">
                            <div className="">
                                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                                    <FileText size={20} />
                                    <span className="font-medium">Thema-Beschreibung</span>
                                </div>
                                <div className="prose prose-zinc dark:prose-invert text-zinc-700 dark:text-zinc-300">
                                    <RichTextDisplay content={lesson.content || "Keine Beschreibung vorhanden."} />
                                </div>
                            </div>

                            {/* Sorted list of infos and questions */}
                            <div className="">
                                <UnifiedContentList facts={facts} questions={questions} onSelectFact={setSelectedFact} onSelectQuestion={setSelectedQuestion} />
                            </div>
                        </div>
                    )}


                    {!isThema && (
                        <>
                            {/* Description if exists */}
                            {lesson.content && (
                                <div className="bg-zinc-50 dark:bg-slate-800/50 rounded-lg p-4 shadow-sm border border-zinc-100 dark:border-slate-700">
                                    <RichTextDisplay content={lesson.content} className="text-sm" />
                                </div>
                            )}

                            {/* Bible Text Section - Only for concrete passages */}
                            {hasBibleRef && lesson.chapter_start !== 0 && verses.length > 0 && (
                                <div className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2 border-b border-indigo-100 dark:border-indigo-900/30 pb-3">
                                        <BookOpen size={18} />
                                        <span className="font-bold uppercase text-[10px] tracking-widest leading-none">Bibeltext</span>
                                        <span className="text-xs font-medium ml-auto opacity-70">
                                            {lesson.verse_ref}
                                        </span>
                                    </div>
                                    <div className="space-y-4">
                                        {verses.map(v => {
                                            // Combine current lesson facts with any potential global word studies
                                            // For the BibleReader component, we treat word study facts as 'LinkedLesson'
                                            const wordStudyLessons = facts
                                                .filter(f => f.fact_kind === 'word_study')
                                                .map(f => ({
                                                    id: f.id,
                                                    title: f.title,
                                                    word: f.word,
                                                    category: 'Wortstudie'
                                                }));

                                            return (
                                                <p
                                                    key={v.id}
                                                    className="text-lg text-zinc-800 dark:text-zinc-200 leading-loose hyphens-auto"
                                                    lang="de"
                                                >
                                                    <sup className="text-xs font-bold text-indigo-500 dark:text-indigo-400 mr-1 select-none">{v.verse}</sup>
                                                    {v.text.split(/(\s+|[.,;!?]+)/g).map((chunk, i) => {
                                                        if (/^\s+$/.test(chunk)) return <span key={i}>{chunk}</span>;
                                                        if (/^[.,;!?]+$/.test(chunk)) return <span key={i} className="text-zinc-500">{chunk}</span>;

                                                        const cleanWord = chunk.replace(/[.,;!?"'()\[\]]/g, '').trim().toLowerCase();
                                                        const matchingFact = facts.find((f: any) =>
                                                            f.fact_kind === 'word_study' &&
                                                            f.word?.toLowerCase() === cleanWord
                                                        );

                                                        if (matchingFact) {
                                                            return (
                                                                <span
                                                                    key={i}
                                                                    onClick={() => setSelectedFact(matchingFact)}
                                                                    className="cursor-pointer font-bold bg-cyan-100 dark:bg-cyan-900/30 text-cyan-900 dark:text-cyan-100 rounded px-0.5 transition-colors border-b-2 border-cyan-400 dark:border-cyan-500"
                                                                >
                                                                    {chunk}
                                                                </span>
                                                            );
                                                        }

                                                        return (
                                                            <span
                                                                key={i}
                                                                onClick={() => {
                                                                    const clean = chunk.replace(/[.,;!?"'()\[\]]/g, '').trim();
                                                                    if (clean.length > 1) setSelectedWord(clean);
                                                                }}
                                                                className="cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded px-0.5 transition-colors"
                                                            >
                                                                {chunk}
                                                            </span>
                                                        );
                                                    })}
                                                </p>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Content cards list (Facts and Questions) */}
                            <div className="">
                                <UnifiedContentList facts={facts} questions={questions} onSelectFact={setSelectedFact} onSelectQuestion={setSelectedQuestion} />
                            </div>
                        </>
                    )}
                </div>

                {/* Personal Notes Section */}
                {notes.length > 0 && (
                    <div className="mt-8 space-y-3">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                            <StickyNote size={18} />
                            <span className="font-semibold text-sm">Meine Notizen</span>
                            <span className="text-xs text-zinc-400">({notes.length})</span>
                        </div>
                        {notes.map(note => (
                            <div
                                key={note.id}
                                className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-xl p-4"
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap flex-1">{note.content}</p>
                                    <div className="flex gap-1 shrink-0">
                                        <button
                                            onClick={() => openEditNote(note)}
                                            className="p-1.5 text-zinc-400 hover:text-indigo-500 rounded transition-colors"
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteNote(note.id)}
                                            className="p-1.5 text-zinc-400 hover:text-red-500 rounded transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[10px] text-zinc-400 mt-2">
                                    {new Date(note.created).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Action Button for Notes */}
            <button
                onClick={openNewNote}
                className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg shadow-amber-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-30"
                title="Notiz hinzufügen"
            >
                <Plus size={24} />
            </button>

            {/* Quiz Section */}
            {quizzes.length > 0 && (
                <div className="max-w-prose mx-auto px-4 mt-8 pb-8">
                    <div className="bg-gradient-to-br from-fuchsia-50 to-purple-50 dark:from-fuchsia-900/10 dark:to-purple-900/10 rounded-xl p-6 border border-fuchsia-100 dark:border-fuchsia-800/30">
                        <div className="flex items-center gap-3 mb-4 text-fuchsia-600 dark:text-fuchsia-400">
                            <Trophy size={24} />
                            <h3 className="text-lg font-bold">Wissen testen</h3>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm">
                            Teste dein Wissen zu dieser Lektion mit einem interaktiven Quiz.
                        </p>
                        <div className="space-y-3">
                            {quizzes.map(quiz => (
                                <button
                                    key={quiz.id}
                                    onClick={() => setActiveQuiz(quiz)}
                                    className="w-full bg-white dark:bg-slate-700 p-4 rounded-lg border border-fuchsia-200 dark:border-fuchsia-800 flex items-center justify-between hover:shadow-md transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400 font-bold">
                                            {quiz.questions.length}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-zinc-900 dark:text-white">{quiz.title || "Wissenstest"}</p>
                                            <p className="text-xs text-zinc-500">20 Sek. pro Frage</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-zinc-300 group-hover:text-fuchsia-500 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Note Modal */}
            {showNoteModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <StickyNote className="text-yellow-500" size={20} />
                                {editingNote ? "Notiz bearbeiten" : "Neue Notiz"}
                            </h3>
                            <button
                                onClick={() => { setShowNoteModal(false); setEditingNote(null); setNoteContent(""); }}
                                className="text-zinc-400 hover:text-zinc-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <textarea
                            value={noteContent}
                            onChange={e => setNoteContent(e.target.value)}
                            placeholder="Deine Gedanken zu dieser Lektion..."
                            className="w-full px-4 py-3 bg-yellow-50 dark:bg-slate-700 border border-yellow-200 dark:border-slate-600 rounded-xl min-h-[150px] text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            autoFocus
                        />
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => { setShowNoteModal(false); setEditingNote(null); setNoteContent(""); }}
                                className="flex-1 py-2.5 bg-zinc-100 dark:bg-slate-700 rounded-lg font-medium text-zinc-600 dark:text-zinc-400"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleSaveNote}
                                disabled={savingNote || !noteContent.trim()}
                                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
                            >
                                <Save size={16} /> {savingNote ? "..." : "Speichern"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quiz Overlay */}
            {activeQuiz && (
                <QuizOverlay
                    quiz={activeQuiz}
                    onClose={() => setActiveQuiz(null)}
                />
            )}

            {/* Word Meaning Popup */}
            {selectedWord && lesson && (
                <WordMeaningPopup
                    word={selectedWord}
                    context={lesson.title}
                    testament={lesson.expand?.book_id?.order && lesson.expand.book_id.order >= 40 ? 'NT' : 'OT'}
                    onClose={() => setSelectedWord(null)}
                />
            )}
        </div>
    );
}
