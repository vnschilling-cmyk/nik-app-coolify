"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { Plus, Trash2, Sparkles, Save, Check, X, GraduationCap, ChevronDown, ChevronRight } from "lucide-react";

interface Question {
    question: string;
    options: string[];
    correct_index: number;
}

interface Quiz {
    id: string;
    title: string;
    lesson_id: string;
    questions: Question[];
}

interface Lesson {
    id: string;
    title: string;
    content: string;
    book_id?: string;
}

export default function LearningTestsTab() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);

    // Create/Edit State
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [mode, setMode] = useState<"manual" | "ai">("manual");
    const [selectedLessonId, setSelectedLessonId] = useState("");
    const [quizTitle, setQuizTitle] = useState("");
    const [autoTitle, setAutoTitle] = useState(true);

    // Manual State
    const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);

    // Expanded State
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    // AI State
    const [aiCount, setAiCount] = useState(5);
    const [generating, setGenerating] = useState(false);

    const [books, setBooks] = useState<{ id: string, name: string, order: number }[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [quizRes, lessonRes, bookRes] = await Promise.all([
                pb.collection('quizzes').getFullList({ sort: '-created' }),
                pb.collection('lessons').getFullList({ sort: 'title' }),
                pb.collection('bible_books').getFullList({ sort: 'order' })
            ]);
            setQuizzes(quizRes.map(q => ({
                id: q.id,
                title: q.title,
                lesson_id: q.lesson_id,
                questions: q.questions
            })));
            setLessons(lessonRes.map(l => ({ id: l.id, title: l.title, content: l.content || "", book_id: l.book_id })));
            setBooks(bookRes.map(b => ({ id: b.id, name: b.name, order: b.order })));
        } catch (e) {
            console.error(e);
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

    const handleGenerateAI = async () => {
        if (!selectedLessonId) return;
        setGenerating(true);
        try {
            const lesson = lessons.find(l => l.id === selectedLessonId);
            if (!lesson) return;

            if (!lesson.content || lesson.content.trim().length === 0) {
                alert("Fehler: Diese Lektion hat keinen Inhalt. Die AI kann keine Fragen generieren.");
                setGenerating(false);
                return;
            }

            const res = await fetch('/api/generate-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: lesson.content, count: aiCount })
            });
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            setCurrentQuestions(data.questions);
            setQuizTitle(`Test: ${lesson.title}`);
        } catch (e: any) {
            alert("Fehler: " + e.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleSaveQuiz = async () => {
        if (!selectedLessonId || !quizTitle || currentQuestions.length === 0) return;
        try {
            if (editingId) {
                await pb.collection('quizzes').update(editingId, {
                    lesson_id: selectedLessonId,
                    title: quizTitle,
                    questions: currentQuestions
                });
                alert("Lerntest aktualisiert!");
            } else {
                await pb.collection('quizzes').create({
                    lesson_id: selectedLessonId,
                    title: quizTitle,
                    questions: currentQuestions
                });
                alert("Lerntest gespeichert!");
            }
            setIsCreating(false);
            resetForm();
            loadData();
        } catch (e: any) {
            alert("Fehler: " + e.message);
        }
    };

    const handleEdit = (quiz: Quiz) => {
        setEditingId(quiz.id);
        setQuizTitle(quiz.title);
        setSelectedLessonId(quiz.lesson_id);
        setCurrentQuestions(quiz.questions);
        setMode("manual");
        setIsCreating(true);
        setAutoTitle(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Wirklich löschen?")) return;
        try {
            await pb.collection('quizzes').delete(id);
            loadData();
        } catch (e: any) {
            alert("Fehler: " + e.message);
        }
    };

    const resetForm = () => {
        setCurrentQuestions([]);
        setQuizTitle("");
        setSelectedLessonId("");
        setMode("manual");
        setEditingId(null);
        setAutoTitle(true);
    };

    const updateQuestion = (idx: number, field: string, value: any) => {
        const newQs = [...currentQuestions];
        if (field === "question") newQs[idx].question = value;
        if (field === "correct_index") newQs[idx].correct_index = value;
        setCurrentQuestions(newQs);
    };

    const updateOption = (qIdx: number, oIdx: number, value: string) => {
        const newQs = [...currentQuestions];
        newQs[qIdx].options[oIdx] = value;
        setCurrentQuestions(newQs);
    };

    const addEmptyQuestion = () => {
        setCurrentQuestions([...currentQuestions, {
            question: "",
            options: ["", "", "", ""],
            correct_index: 0
        }]);
    };

    const removeQuestion = (idx: number) => {
        setCurrentQuestions(currentQuestions.filter((_, i) => i !== idx));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end items-center mb-6">
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center justify-center w-12 h-12 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                        title="Neuer Test"
                    >
                        <Plus size={24} />
                    </button>
                )}
            </div>

            {isCreating ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-zinc-200 dark:border-slate-700 p-6 animate-fadeIn">
                    <div className="flex justify-between mb-6">
                        <h3 className="text-lg font-bold">{editingId ? "Test bearbeiten" : "Neuen Test erstellen"}</h3>
                        <button onClick={() => { setIsCreating(false); resetForm(); }} className="text-zinc-400 hover:text-zinc-600">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Lektion *</label>
                            <div className="flex flex-col gap-2">
                                <select
                                    value={selectedLessonId}
                                    onChange={e => {
                                        const newId = e.target.value;
                                        setSelectedLessonId(newId);
                                        if (autoTitle) {
                                            const lesson = lessons.find(l => l.id === newId);
                                            if (lesson) setQuizTitle(`Test: ${lesson.title}`);
                                        }
                                    }}
                                    className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600"
                                >
                                    <option value="">Bitte wählen...</option>
                                    {lessons.map(l => (
                                        <option key={l.id} value={l.id}>{l.title}</option>
                                    ))}
                                </select>
                                <div className="flex items-center gap-2" title="Titel automatisch setzen">
                                    <input
                                        type="checkbox"
                                        id="autoTitle"
                                        checked={autoTitle}
                                        onChange={e => {
                                            const checked = e.target.checked;
                                            setAutoTitle(checked);
                                            if (checked && selectedLessonId) {
                                                const lesson = lessons.find(l => l.id === selectedLessonId);
                                                if (lesson) setQuizTitle(`Test: ${lesson.title}`);
                                            }
                                        }}
                                        className="w-5 h-5 rounded border-zinc-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <label htmlFor="autoTitle" className="text-sm font-bold text-zinc-600 dark:text-zinc-400 select-none cursor-pointer whitespace-nowrap">
                                        Test-Titel automatisch generieren
                                    </label>
                                </div>
                            </div>
                        </div>
                        {!autoTitle && (
                            <div className="animate-fadeIn">
                                <label className="block text-sm font-medium mb-1">Titel *</label>
                                <input
                                    type="text"
                                    value={quizTitle}
                                    onChange={e => setQuizTitle(e.target.value)}
                                    className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600"
                                    placeholder="z.B. Test zu 1. Petrus 1"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={() => setMode("manual")}
                            className={`flex-1 py-4 rounded-xl border-2 flex items-center justify-center transition-all ${mode === "manual" ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" : "border-zinc-200 dark:border-slate-700 text-zinc-400"}`}
                            title="Manuell erstellen"
                        >
                            <Plus size={28} />
                        </button>
                        <button
                            onClick={() => setMode("ai")}
                            className={`flex-1 py-4 rounded-xl border-2 flex items-center justify-center transition-all ${mode === "ai" ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600" : "border-zinc-200 dark:border-slate-700 text-zinc-400"}`}
                            title="Mit AI generieren"
                        >
                            <Sparkles size={28} />
                        </button>
                    </div>

                    {mode === "ai" && (
                        <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-800 mb-6">
                            <div className="flex items-end gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium mb-1 text-purple-900 dark:text-purple-200">Anzahl Fragen</label>
                                    <select
                                        value={aiCount}
                                        onChange={e => setAiCount(Number(e.target.value))}
                                        className="w-full p-2 rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-slate-700"
                                    >
                                        <option value="3">3 Fragen</option>
                                        <option value="5">5 Fragen</option>
                                        <option value="10">10 Fragen</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleGenerateAI}
                                    disabled={generating || !selectedLessonId}
                                    className="px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed h-10 w-10 flex items-center justify-center shrink-0"
                                    title="Vorschläge generieren"
                                >
                                    {generating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={20} />}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 mb-8">
                        {currentQuestions.map((q, qIdx) => (
                            <div key={qIdx} className="border border-zinc-200 dark:border-slate-700 rounded-xl p-4 bg-zinc-50 dark:bg-slate-700/50">
                                <div className="flex justify-between mb-3">
                                    <span className="font-bold text-sm text-zinc-500">Frage {qIdx + 1}</span>
                                    <button onClick={() => removeQuestion(qIdx)} className="text-red-400 hover:text-red-500"><Trash2 size={16} /></button>
                                </div>
                                <input
                                    className="w-full mb-3 p-2 rounded font-medium dark:bg-slate-700 border dark:border-slate-600"
                                    value={q.question}
                                    onChange={e => updateQuestion(qIdx, 'question', e.target.value)}
                                    placeholder="Die Frage..."
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {q.options.map((opt, oIdx) => (
                                        <div key={oIdx} className="flex items-center gap-2">
                                            <button
                                                onClick={() => updateQuestion(qIdx, 'correct_index', oIdx)}
                                                className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${q.correct_index === oIdx ? "bg-emerald-500 border-emerald-500 text-white" : "border-zinc-300 dark:border-slate-600"}`}
                                            >
                                                {q.correct_index === oIdx && <Check size={14} />}
                                            </button>
                                            <input
                                                className={`flex-1 p-1.5 text-sm rounded border ${q.correct_index === oIdx ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "dark:bg-slate-700 dark:border-slate-600"}`}
                                                value={opt}
                                                onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                                                placeholder={`Antwort ${oIdx + 1}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={addEmptyQuestion}
                            className="flex-1 py-4 border-2 border-dashed border-zinc-300 dark:border-slate-700 rounded-xl text-zinc-400 flex items-center justify-center hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                            title="Frage hinzufügen"
                        >
                            <Plus size={28} />
                        </button>
                        <button
                            onClick={handleSaveQuiz}
                            disabled={currentQuestions.length === 0 || !quizTitle}
                            className="flex-1 py-4 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
                            title={editingId ? "Änderungen speichern" : "Test Speichern"}
                        >
                            <Save size={28} />
                        </button>
                    </div>

                </div>
            ) : (
                <div className="space-y-4">
                    {loading ? (
                        <p className="text-center py-10 text-zinc-500">Lade Tests...</p>
                    ) : quizzes.length === 0 ? (
                        <p className="text-center py-10 text-zinc-500">Noch keine Tests erstellt.</p>
                    ) : (
                        (() => {
                            const testsByBook = new Map<string, {
                                id: string;
                                title: string;
                                order: number;
                                lessons: Map<string, Quiz[]>;
                            }>();

                            quizzes.forEach(q => {
                                const lesson = lessons.find(l => l.id === q.lesson_id);
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

                                if (!testsByBook.has(bookId)) {
                                    testsByBook.set(bookId, { id: bookId, title: bookTitle, order: bookOrder, lessons: new Map() });
                                }

                                const bookGroup = testsByBook.get(bookId)!;
                                const lessonList = bookGroup.lessons.get(lesson.id) || [];
                                lessonList.push(q);
                                bookGroup.lessons.set(lesson.id, lessonList);
                            });

                            const sortedBooks = Array.from(testsByBook.values()).sort((a, b) => a.order - b.order);

                            return sortedBooks.map(bookGroup => {
                                const isExpanded = expandedGroups.has(bookGroup.id);
                                const totalTests = Array.from(bookGroup.lessons.values()).flat().length;

                                return (
                                    <section key={bookGroup.id} className="bg-zinc-50 dark:bg-slate-800/40 rounded-xl overflow-hidden border border-zinc-200 dark:border-slate-700">
                                        <button
                                            onClick={() => toggleGroup(bookGroup.id)}
                                            className="w-full flex items-center justify-between p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <h3 className={`text-sm font-bold uppercase tracking-wider ${bookGroup.id !== 'general' ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-600"}`}>
                                                    {bookGroup.title}
                                                </h3>
                                                <span className="text-zinc-400 text-xs font-normal">({totalTests})</span>
                                            </div>
                                            {isExpanded ? <ChevronDown size={20} className="text-zinc-400" /> : <ChevronRight size={20} className="text-zinc-400" />}
                                        </button>

                                        {isExpanded && (
                                            <div className="border-t border-zinc-200 dark:border-slate-700">
                                                {Array.from(bookGroup.lessons.entries()).map(([lessonId, lessonQuizzes]) => {
                                                    const lesson = lessons.find(l => l.id === lessonId);
                                                    const lessonKey = `${bookGroup.id}-${lessonId}`;
                                                    const isLessonExpanded = expandedGroups.has(lessonKey);

                                                    return (
                                                        <div key={lessonId} className="border-b border-zinc-200 dark:border-slate-700 last:border-0">
                                                            <button
                                                                onClick={() => toggleGroup(lessonKey)}
                                                                className="w-full flex items-center justify-between p-3 pl-6 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <GraduationCap size={16} className="text-fuchsia-600 dark:text-fuchsia-400" />
                                                                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                                                        {lesson?.title}
                                                                    </span>
                                                                    <span className="text-zinc-400 text-xs">({lessonQuizzes.length})</span>
                                                                </div>
                                                                {isLessonExpanded ? <ChevronDown size={16} className="text-zinc-400" /> : <ChevronRight size={16} className="text-zinc-400" />}
                                                            </button>

                                                            {isLessonExpanded && (
                                                                <div className="p-3 pl-8 space-y-2 bg-white dark:bg-slate-800">
                                                                    {lessonQuizzes.map(quiz => (
                                                                        <div key={quiz.id} className="border border-zinc-100 dark:border-slate-700 rounded-lg p-3 flex justify-between items-center group hover:border-fuchsia-300 dark:hover:border-fuchsia-700 transition-colors bg-zinc-50 dark:bg-slate-700/30">
                                                                            <div>
                                                                                <h4 className="font-medium text-sm text-zinc-800 dark:text-zinc-200">{quiz.title}</h4>
                                                                                <p className="text-[10px] text-zinc-500">{quiz.questions.length} Fragen</p>
                                                                            </div>
                                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); handleEdit(quiz); }}
                                                                                    className="p-1.5 text-zinc-400 hover:text-indigo-500 transition-colors"
                                                                                    title="Bearbeiten"
                                                                                >
                                                                                    <Sparkles size={16} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); handleDelete(quiz.id); }}
                                                                                    className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                                                                                    title="Löschen"
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
