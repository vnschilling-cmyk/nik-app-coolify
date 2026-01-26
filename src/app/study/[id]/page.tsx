"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import Link from "next/link";
import { ChevronLeft, FileText, Lightbulb, Image as ImageIcon, Video, ExternalLink, Map as MapIcon, BookOpen, HelpCircle, StickyNote, Plus, X, Save, Trash2, Edit, Brain, GraduationCap, Trophy, ChevronRight } from "lucide-react";
import RichTextDisplay from "@/components/ui/RichTextDisplay";
import WordMeaningPopup from "@/components/features/WordMeaningPopup";
import QuizOverlay from "@/components/features/QuizOverlay";

const TYPE_ICONS: Record<string, any> = {
    text: FileText,
    image: ImageIcon,
    video: Video,
    link: ExternalLink,
    map: MapIcon
};

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
    verse_start: number;
    verse_end: number;
    lesson_id: string;
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
                pb.collection('facts').getFullList({ filter: `lesson_id="${id}"`, sort: 'title' }).catch(() => []),
                pb.collection('questions').getFullList({ filter: `lesson_id="${id}"`, sort: 'order' }).catch(() => []),
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
                chapter_start: lessonRes.chapter_start || 1,
                verse_start: lessonRes.verse_start || 1,
                verse_end: lessonRes.verse_end || 10,
                expand: lessonRes.expand
            };

            setLesson(loadedLesson);
            setFacts(factsRes.map(r => ({
                id: r.id,
                title: r.title || "",
                description: r.description || "",
                category: r.category || "",
                type: r.type || "text",
                verse_start: r.verse_start || 0,
                verse_end: r.verse_end || 0,
                lesson_id: r.lesson_id || ""
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

            setQuestions(questionsRes.map(r => ({
                id: r.id,
                question: r.question || "",
                category: r.category || "allgemein",
                lesson_id: r.lesson_id || "",
                verse_start: r.verse_start || 0,
                verse_end: r.verse_end || 0,
                answer: r.answer || "",
                is_answered: r.is_answered || false
            })));

            setNotes(notesRes.map(r => ({
                id: r.id,
                content: r.content || "",
                lesson_id: r.lesson_id || "",
                verse_start: r.verse_start || 0,
                verse_end: r.verse_end || 0,
                created: r.created || ""
            })));

            // Load Bible Verses if applicable
            if (loadedLesson.book_id && loadedLesson.category !== "Thema") {
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
    const hasBibleRef = lesson.book_id && !isThema;

    return (
        <div className="min-h-screen pb-24 bg-white dark:bg-black">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 px-4 py-4 flex items-center gap-4">
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
                    <h1 className="text-lg font-bold truncate">{lesson.title}</h1>
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

            <div className="max-w-prose mx-auto p-4">
                {/* Fact Detail Popup */}
                {selectedFact && (
                    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setSelectedFact(null)}>
                        <div className="bg-amber-50 dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-lg shadow-xl border-2 border-amber-400 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-3 shrink-0">
                                <Lightbulb className="w-5 h-5" />
                                <span className="font-bold">Info</span>
                                {selectedFact.category && (
                                    <span className="text-xs bg-amber-200 dark:bg-amber-800 px-2 py-0.5 rounded-full">{selectedFact.category}</span>
                                )}
                            </div>
                            <h3 className="font-bold text-lg mb-2 shrink-0">{selectedFact.title}</h3>

                            <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0 text-zinc-700 dark:text-zinc-300 pr-2">
                                <RichTextDisplay content={selectedFact.description || "Keine Beschreibung."} />
                            </div>

                            <button
                                onClick={() => setSelectedFact(null)}
                                className="mt-4 w-full py-2 bg-amber-500 text-white rounded-lg font-medium shrink-0 hover:bg-amber-600 transition-colors"
                            >
                                Schließen
                            </button>
                        </div>
                    </div>
                )}

                {/* Question Detail Popup */}
                {selectedQuestion && (
                    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setSelectedQuestion(null)}>
                        <div className="bg-emerald-50 dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-lg shadow-xl border-2 border-emerald-400 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
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
                <div className="space-y-6">
                    {/* Thema: Show only description */}
                    {isThema && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-4">
                                <FileText size={20} />
                                <span className="font-medium">Thema-Beschreibung</span>
                            </div>
                            <div className="prose prose-zinc dark:prose-invert text-zinc-700 dark:text-zinc-300">
                                <RichTextDisplay content={lesson.content || "Keine Beschreibung vorhanden."} />
                            </div>
                        </div>
                    )}

                    {!isThema && (
                        <>
                            {/* Description if exists */}
                            {lesson.content && (
                                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
                                    <RichTextDisplay content={lesson.content} className="text-sm" />
                                </div>
                            )}

                            {/* Bible Text with Facts */}
                            {hasBibleRef ? (
                                verses.length === 0 ? (
                                    <div className="text-center py-8 text-zinc-500">
                                        <p>Kein Bibeltext gefunden.</p>
                                    </div>
                                ) : (
                                    <div className="verse-text space-y-4">
                                        {verses.map(v => {
                                            const verseFacts = facts.filter(f =>
                                                v.verse >= f.verse_start && v.verse <= f.verse_end
                                            );
                                            const verseQuestions = questions.filter(q =>
                                                q.category === "bibeltext" && v.verse >= q.verse_start && v.verse <= q.verse_end
                                            );

                                            return (
                                                <div key={v.id} className="relative pl-0 md:pl-4">
                                                    <div className="flex items-start gap-3">
                                                        {/* Question icons on the left */}
                                                        {verseQuestions.length > 0 && (
                                                            <div className="flex flex-col gap-1 shrink-0 pt-1">
                                                                {verseQuestions.map(q => (
                                                                    <button
                                                                        key={q.id}
                                                                        onClick={() => setSelectedQuestion(q)}
                                                                        className="w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-sm hover:scale-110 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 hover:bg-emerald-200"
                                                                        title={q.question}
                                                                    >
                                                                        <HelpCircle size={16} />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <div className="flex-1">
                                                            <p className="text-lg text-zinc-800 dark:text-zinc-200 leading-loose">
                                                                <sup className="text-xs font-bold text-indigo-500 dark:text-indigo-400 mr-1 select-none">{v.verse}</sup>
                                                                {v.text.split(/(\s+)/g).map((chunk, i) => {
                                                                    if (/^\s+$/.test(chunk)) return <span key={i}>{chunk}</span>;
                                                                    return (
                                                                        <span
                                                                            key={i}
                                                                            onClick={() => {
                                                                                const cleanWord = chunk.replace(/[.,;!?"'()\[\]]/g, '').trim();
                                                                                if (cleanWord.length > 1) setSelectedWord(cleanWord);
                                                                            }}
                                                                            className="cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded px-0.5 transition-colors"
                                                                        >
                                                                            {chunk}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </p>
                                                        </div>

                                                        {/* Facts column */}
                                                        {verseFacts.length > 0 && (
                                                            <div className="flex flex-col gap-2 shrink-0 pt-1">
                                                                {verseFacts.map(fact => {
                                                                    const Icon = TYPE_ICONS[fact.type] || FileText;
                                                                    const colorClass =
                                                                        fact.type === 'image' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400 hover:bg-purple-200' :
                                                                            fact.type === 'video' ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 hover:bg-red-200' :
                                                                                fact.type === 'map' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 hover:bg-emerald-200' :
                                                                                    fact.type === 'link' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 hover:bg-blue-200' :
                                                                                        'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400 hover:bg-amber-200';

                                                                    return (
                                                                        <button
                                                                            key={fact.id}
                                                                            onClick={() => setSelectedFact(fact)}
                                                                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm hover:scale-110 ${colorClass}`}
                                                                            title={fact.title}
                                                                        >
                                                                            <Icon size={18} />
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )
                            ) : (
                                <div className="text-center py-8 text-zinc-500">
                                    <BookOpen className="w-10 h-10 mx-auto mb-3 text-zinc-300" />
                                    <p>Keine Bibelstelle verknüpft.</p>
                                </div>
                            )}
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
                                    className="w-full bg-white dark:bg-zinc-900 p-4 rounded-lg border border-fuchsia-200 dark:border-fuchsia-800 flex items-center justify-between hover:shadow-md transition-all group"
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
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md shadow-xl">
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
                            className="w-full px-4 py-3 bg-yellow-50 dark:bg-zinc-800 border border-yellow-200 dark:border-zinc-700 rounded-xl min-h-[150px] text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            autoFocus
                        />
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => { setShowNoteModal(false); setEditingNote(null); setNoteContent(""); }}
                                className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg font-medium text-zinc-600 dark:text-zinc-400"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleSaveNote}
                                disabled={savingNote || !noteContent.trim()}
                                className="flex-1 py-2.5 bg-yellow-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-yellow-600 disabled:opacity-50"
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
