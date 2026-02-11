"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { Plus, Trash2, Sparkles, Save, Check, X, GraduationCap, ChevronDown, ChevronRight, Pencil, RefreshCw, BarChart, FileText, User } from "lucide-react";
import clsx from "clsx";
import { usePermissions } from "@/hooks/usePermissions";
import { calculateGrade, getGradeColor } from "@/lib/grades";

interface Question {
    question: string;
    options: string[];
    correct_index: number;
    difficulty?: string;
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
    category: string;
    content: string;
    book_id: string;
    chapter_start: number;
    verse_start: number;
    verse_end: number;
}

interface QuizResult {
    id: string;
    created: string;
    score: number;
    total: number;
    percentage: number;
    grade: number;
    expand?: {
        user?: { name: string; email: string };
        quiz?: { title: string };
    };
}

export default function LearningTestsTab() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const { canAccessSection } = usePermissions();
    const hasAIPermission = canAccessSection("ai_quiz");

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
    const [aiDifficulty, setAiDifficulty] = useState("Hirte");
    const [generating, setGenerating] = useState(false);

    const [books, setBooks] = useState<{ id: string, name: string, order: number }[]>([]);

    // View Mode State
    const [viewMode, setViewMode] = useState<"tests" | "results">("tests");
    const [results, setResults] = useState<QuizResult[]>([]);
    const [loadingResults, setLoadingResults] = useState(false);

    useEffect(() => {
        if (viewMode === "tests") {
            loadData();
        } else {
            loadResults();
        }
    }, [viewMode]);

    const loadResults = async () => {
        setLoadingResults(true);
        try {
            const res = await pb.collection('quiz_results').getFullList({
                sort: '-created',
                expand: 'user,quiz'
            });
            // Type assertion to ensure expanded properties are accessible
            setResults(res as unknown as QuizResult[]);
        } catch (e) {
            console.error("Error loading results:", e);
        } finally {
            setLoadingResults(false);
        }
    };

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
            setLessons(lessonRes.map(r => ({
                id: r.id,
                title: r.title || "(Ohne Titel)",
                category: r.category || "Allgemein",
                content: r.content || "",
                book_id: r.book_id || "",
                chapter_start: r.chapter_start ?? 1,
                verse_start: r.verse_start ?? 1,
                verse_end: r.verse_end ?? 10
            })));
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
        if (!hasAIPermission) {
            alert("Du hast keine Berechtigung für KI-Funktionen.");
            return;
        }
        if (!selectedLessonId) return;
        setGenerating(true);
        try {
            const lesson = lessons.find(l => l.id === selectedLessonId);
            if (!lesson) return;

            const [lessonFacts, lessonQuestions] = await Promise.all([
                pb.collection('facts').getFullList({
                    filter: `lesson_id="${selectedLessonId}"`,
                    sort: 'order'
                }),
                pb.collection('questions').getFullList({
                    filter: `lesson_id="${selectedLessonId}"`,
                    sort: 'order'
                })
            ]);

            const hasBriefDescription = lesson.content && lesson.content.trim().length > 0;
            const hasFacts = lessonFacts.length > 0;
            const hasQuestions = lessonQuestions.length > 0;

            if (!hasBriefDescription && !hasFacts && !hasQuestions) {
                alert("Fehler: Diese Lektion hat keinen Inhalt. Es können keine Fragen generiert werden.");
                setGenerating(false);
                return;
            }

            const res = await fetch('/api/generate-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: lesson.content,
                    count: aiCount,
                    difficulty: aiDifficulty,
                    lessonQuestions: lessonQuestions.map(q => ({
                        question: q.question,
                        answer: q.answer
                    })),
                    lessonInfos: lessonFacts.map(f => ({
                        title: f.title,
                        description: f.description
                    }))
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            const shuffledQuestions = data.questions.map((q: Question) => {
                const optionsWithCorrect = q.options.map((opt, i) => ({
                    text: opt,
                    isCorrect: i === q.correct_index
                }));
                for (let i = optionsWithCorrect.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [optionsWithCorrect[i], optionsWithCorrect[j]] = [optionsWithCorrect[j], optionsWithCorrect[i]];
                }
                return {
                    question: q.question,
                    options: optionsWithCorrect.map(o => o.text),
                    correct_index: optionsWithCorrect.findIndex(o => o.isCorrect),
                    difficulty: q.difficulty || aiDifficulty
                };
            });

            setCurrentQuestions(shuffledQuestions);
            setQuizTitle(`Test: ${lesson.title} (${aiDifficulty})`);
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
        if (field === "difficulty") newQs[idx].difficulty = value;
        setCurrentQuestions(newQs);
    };

    const updateOption = (qIdx: number, oIdx: number, value: string) => {
        const newQs = [...currentQuestions];
        newQs[qIdx].options[oIdx] = value;
        setCurrentQuestions(newQs);
    };

    const shuffleOptions = (qIdx: number) => {
        const newQs = [...currentQuestions];
        const q = newQs[qIdx];
        const optionsWithCorrect = q.options.map((opt, i) => ({
            text: opt,
            isCorrect: i === q.correct_index
        }));
        for (let i = optionsWithCorrect.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [optionsWithCorrect[i], optionsWithCorrect[j]] = [optionsWithCorrect[j], optionsWithCorrect[i]];
        }
        q.options = optionsWithCorrect.map(o => o.text);
        q.correct_index = optionsWithCorrect.findIndex(o => o.isCorrect);
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
        <div className="px-4 pb-20 space-y-6 text-zinc-900 dark:text-zinc-100">
            {!isCreating && (
                <div className="flex justify-between items-center mb-6">
                    <div className="bg-zinc-100 dark:bg-white/5 p-1 rounded-xl inline-flex">
                        <button
                            onClick={() => setViewMode("tests")}
                            className={clsx(
                                "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                                viewMode === "tests"
                                    ? "bg-white dark:bg-slate-700 shadow-sm text-zinc-900 dark:text-white"
                                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                            )}
                        >
                            <FileText size={16} />
                            Tests verwalten
                        </button>
                        <button
                            onClick={() => setViewMode("results")}
                            className={clsx(
                                "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                                viewMode === "results"
                                    ? "bg-white dark:bg-slate-700 shadow-sm text-zinc-900 dark:text-white"
                                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                            )}
                        >
                            <BarChart size={16} />
                            Ergebnisse
                        </button>
                    </div>
                    {viewMode === "tests" && (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="flex items-center justify-center w-11 h-11 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                            title="Neuer Test"
                        >
                            <Plus size={22} />
                        </button>
                    )}
                </div>
            )}

            {viewMode === "results" && (
                <div className="space-y-4 animate-fadeIn">
                    {loadingResults ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-zinc-500 font-medium">Lade Ergebnisse...</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="text-center py-20 bg-zinc-50 dark:bg-slate-800/20 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                            <BarChart size={48} className="mx-auto text-zinc-300 mb-4" />
                            <p className="text-zinc-500 font-medium">Noch keine Testergebnisse vorhanden.</p>
                        </div>
                    ) : (
                        results.map((result) => {
                            const gradeInfo = calculateGrade(result.percentage);
                            return (
                                <div key={result.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-zinc-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold border", getGradeColor(gradeInfo.grade))}>
                                            {gradeInfo.grade}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                                                {result.expand?.quiz?.title || "Gelöschter Test"}
                                            </h4>
                                            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                                <User size={12} />
                                                <span>{result.expand?.user?.name || result.expand?.user?.email || "Unbekannter Nutzer"}</span>
                                                <span className="mx-1">•</span>
                                                <span>{new Date(result.created).toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 pl-16 sm:pl-0">
                                        <div className="text-center">
                                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Punkte</p>
                                            <p className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                                {result.score} <span className="text-zinc-400 text-xs">/ {result.total}</span>
                                            </p>
                                        </div>
                                        <div className="text-center min-w-[60px]">
                                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Prozent</p>
                                            <p className={clsx("font-bold", gradeInfo.color)}>
                                                {result.percentage}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {isCreating && (
                <div className="bg-zinc-50 dark:bg-slate-400/10 dark:backdrop-blur-md rounded-3xl border border-zinc-100 dark:border-white/5 p-6 shadow-2xl animate-fadeIn mb-8 text-zinc-900 dark:text-zinc-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            {editingId ? "Test bearbeiten" : "Neuer Test"}
                        </h2>
                        <button onClick={() => { setIsCreating(false); resetForm(); }} className="text-zinc-400 hover:text-zinc-600 transition-colors" title="Schließen">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Lektion *</label>
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
                                className="w-full p-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none text-zinc-900 dark:text-white"
                                title="Lektion auswählen"
                            >
                                <option value="">Lektion wählen...</option>
                                {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Test-Titel *</label>
                            <div className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    value={quizTitle}
                                    onChange={e => { setQuizTitle(e.target.value); setAutoTitle(false); }}
                                    placeholder="Titel des Tests..."
                                    className="w-full p-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none text-zinc-900 dark:text-white"
                                    title="Test-Titel"
                                />
                                <label className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={autoTitle}
                                        onChange={e => setAutoTitle(e.target.checked)}
                                        className="rounded border-zinc-300 dark:border-white/10"
                                    />
                                    <span>Titel automatisch generieren</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 mb-6 pt-4 border-t border-zinc-100 dark:border-white/5">
                        <button
                            type="button"
                            onClick={() => setMode("manual")}
                            className={clsx(
                                "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium",
                                mode === "manual"
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                                    : "bg-white/5 opacity-50 border-zinc-200 dark:border-white/5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-slate-800"
                            )}
                            title="Manuell erstellen"
                        >
                            <Pencil size={18} />
                            <span>Manuell</span>
                        </button>
                        {hasAIPermission && (
                            <button
                                type="button"
                                onClick={() => setMode("ai")}
                                className={clsx(
                                    "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium",
                                    mode === "ai"
                                        ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/30"
                                        : "bg-white/5 opacity-50 border-zinc-200 dark:border-white/5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-slate-800"
                                )}
                                title="KI Generierung"
                            >
                                <Sparkles size={18} />
                                <span>KI</span>
                            </button>
                        )}
                    </div>

                    {mode === "ai" && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl border border-purple-100 dark:border-white/10 mb-6">
                            <div className="flex items-end gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-2">Anzahl Fragen</label>
                                    <select
                                        value={aiCount}
                                        onChange={e => setAiCount(Number(e.target.value))}
                                        className="w-full p-2 rounded-xl border border-purple-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-purple-500/20 outline-none text-zinc-900 dark:text-white"
                                        title="Anzahl Fragen auswählen"
                                    >
                                        <option value="3">3 Fragen</option>
                                        <option value="5">5 Fragen</option>
                                        <option value="10">10 Fragen</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-2">Schwierigkeit</label>
                                    <select
                                        value={aiDifficulty}
                                        onChange={e => setAiDifficulty(e.target.value)}
                                        className="w-full p-2 rounded-xl border border-purple-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-purple-500/20 outline-none text-zinc-900 dark:text-white"
                                        title="Schwierigkeit auswählen"
                                    >
                                        <option value="Bauer">Bauer (Einfach)</option>
                                        <option value="Hirte">Hirte (Mittel)</option>
                                        <option value="Gamaliel">Gamaliel (Schwer)</option>
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleGenerateAI}
                                    disabled={generating || !selectedLessonId}
                                    className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed h-10 w-10 flex items-center justify-center shrink-0"
                                    title="Vorschläge generieren"
                                >
                                    {generating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={20} />}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 mb-8">
                        {currentQuestions.map((q, qIdx) => (
                            <div key={qIdx} className="border border-zinc-200 dark:border-slate-700 rounded-xl p-4 bg-zinc-50 dark:bg-slate-800/50">
                                <div className="flex justify-between mb-3">
                                    <span className="font-bold text-xs text-zinc-500 dark:text-zinc-400">Frage {qIdx + 1}</span>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={q.difficulty || "Hirte"}
                                            onChange={e => updateQuestion(qIdx, 'difficulty', e.target.value)}
                                            className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-zinc-600 dark:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                                            title="Schwierigkeitsgrad für diese Frage auswählen"
                                        >
                                            <option value="Bauer">Bauer (Einfach)</option>
                                            <option value="Hirte">Hirte (Mittel)</option>
                                            <option value="Gamaliel">Gamaliel (Schwer)</option>
                                        </select>
                                        <div className="w-px h-4 bg-zinc-300 dark:bg-slate-600 mx-1"></div>
                                        <button
                                            type="button"
                                            onClick={() => shuffleOptions(qIdx)}
                                            className="text-indigo-400 hover:text-indigo-600 transition-colors"
                                            title="Antworten zufällig mischen"
                                        >
                                            <RefreshCw size={16} />
                                        </button>
                                        <button type="button" onClick={() => removeQuestion(qIdx)} className="text-red-400 hover:text-red-500 transition-colors" title="Diese Frage löschen">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <input
                                    className="w-full mb-3 p-2 rounded-lg font-medium bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-zinc-900 dark:text-white"
                                    value={q.question}
                                    onChange={e => updateQuestion(qIdx, 'question', e.target.value)}
                                    placeholder="Frage eingeben..."
                                    title={`Frage ${qIdx + 1}`}
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {q.options.map((opt, oIdx) => (
                                        <div key={oIdx} className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => updateQuestion(qIdx, 'correct_index', oIdx)}
                                                className={clsx(
                                                    "w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all",
                                                    q.correct_index === oIdx ? "bg-emerald-500 border-emerald-500 text-white" : "border-zinc-300 dark:border-slate-600 hover:border-emerald-300"
                                                )}
                                                title={`Als richtige Antwort markieren (Option ${oIdx + 1})`}
                                            >
                                                {q.correct_index === oIdx && <Check size={14} />}
                                            </button>
                                            <input
                                                className={clsx(
                                                    "flex-1 p-2 text-sm rounded-lg border transition-all cursor-pointer outline-none",
                                                    q.correct_index === oIdx
                                                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100"
                                                        : "bg-white dark:bg-slate-900 border-zinc-200 dark:border-slate-700 hover:border-zinc-400 text-zinc-800 dark:text-zinc-200"
                                                )}
                                                value={opt}
                                                onClick={() => updateQuestion(qIdx, 'correct_index', oIdx)}
                                                onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                                                placeholder={`Option ${oIdx + 1}`}
                                                title={`Antwort-Option ${oIdx + 1}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4 pt-6 border-t border-zinc-100 dark:border-white/5">
                        <button
                            type="button"
                            onClick={addEmptyQuestion}
                            className="flex-1 py-3 bg-zinc-100 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-xl text-zinc-500 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
                            title="Frage hinzufügen"
                        >
                            <Plus size={24} />
                            <span className="ml-2 font-medium">Frage hinzufügen</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveQuiz}
                            disabled={currentQuestions.length === 0 || !quizTitle}
                            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95 font-bold"
                            title={editingId ? "Änderungen speichern" : "Test Speichern"}
                        >
                            <Save size={24} />
                            <span className="ml-2">{editingId ? "Änderungen speichern" : "Test speichern"}</span>
                        </button>
                    </div>
                </div>
            )}

            {!isCreating && viewMode === "tests" && (
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-zinc-500 font-medium">Lade Tests...</p>
                        </div>
                    ) : quizzes.length === 0 ? (
                        <div className="text-center py-20 bg-zinc-50 dark:bg-slate-800/20 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                            <GraduationCap size={48} className="mx-auto text-zinc-300 mb-4" />
                            <p className="text-zinc-500 font-medium">Noch keine Tests erstellt.</p>
                            <button onClick={() => setIsCreating(true)} className="mt-4 text-indigo-600 font-bold hover:underline">Ersten Test erstellen</button>
                        </div>
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
                                const sortedLessons = Array.from(bookGroup.lessons.entries())
                                    .map(([lessonId, quizzes]) => ({
                                        lesson: lessons.find(l => l.id === lessonId),
                                        quizzes: quizzes.sort((a, b) => a.title.localeCompare(b.title))
                                    }))
                                    .filter(item => item.lesson)
                                    .sort((a, b) => (a.lesson?.title || "").localeCompare(b.lesson?.title || ""));

                                return (
                                    <section key={bookGroup.id} className="bg-zinc-50 dark:bg-slate-800/40 rounded-3xl overflow-hidden border border-zinc-100 dark:border-white/5 shadow-sm transition-all">
                                        <button
                                            onClick={() => toggleGroup(bookGroup.id)}
                                            className="w-full flex items-center justify-between p-5 hover:bg-zinc-100 dark:hover:bg-slate-800/50 transition-colors"
                                            title={isExpanded ? "Zuklappen" : "Aufklappen"}
                                        >
                                            <div className="flex items-center gap-3">
                                                <h3 className={clsx("text-sm font-bold uppercase tracking-widest", bookGroup.id !== 'general' ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500")}>
                                                    {bookGroup.title}
                                                </h3>
                                                <span className="bg-white dark:bg-white/10 text-zinc-500 dark:text-zinc-400 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                                                    {totalTests}
                                                </span>
                                            </div>
                                            {isExpanded ? <ChevronDown size={20} className="text-zinc-400" /> : <ChevronRight size={20} className="text-zinc-400" />}
                                        </button>

                                        {isExpanded && (
                                            <div className="divide-y divide-zinc-100 dark:divide-white/5 bg-white/30 dark:bg-black/10">
                                                {sortedLessons.map(({ lesson, quizzes: lessonQuizzes }) => {
                                                    const lessonId = lesson!.id;
                                                    const lessonKey = `${bookGroup.id}-${lessonId}`;
                                                    const isLessonExpanded = expandedGroups.has(lessonKey);

                                                    return (
                                                        <div key={lessonId}>
                                                            <button
                                                                onClick={() => toggleGroup(lessonKey)}
                                                                className="w-full flex items-center justify-between p-4 pl-8 hover:bg-white dark:hover:bg-slate-800/50 transition-all"
                                                                title={isLessonExpanded ? "Lektion zuklappen" : "Lektion aufklappen"}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shadow-sm">
                                                                        <GraduationCap size={20} className="text-purple-600 dark:text-purple-400" />
                                                                    </div>
                                                                    <div className="flex flex-col items-start">
                                                                        <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                                                            {lesson?.title}
                                                                        </span>
                                                                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-bold">{lessonQuizzes.length} {lessonQuizzes.length === 1 ? 'Test' : 'Tests'}</span>
                                                                    </div>
                                                                </div>
                                                                {isLessonExpanded ? <ChevronDown size={18} className="text-zinc-400" /> : <ChevronRight size={18} className="text-zinc-400" />}
                                                            </button>

                                                            {isLessonExpanded && (
                                                                <div className="p-4 pl-12 gap-3 grid grid-cols-1 sm:grid-cols-2 bg-zinc-50/50 dark:bg-black/20">
                                                                    {lessonQuizzes.map(quiz => (
                                                                        <div key={quiz.id} className="bg-white dark:bg-slate-800/80 border border-zinc-100 dark:border-white/5 rounded-2xl p-4 flex justify-between items-center group hover:shadow-lg hover:shadow-purple-500/5 transition-all">
                                                                            <div className="flex items-center gap-4">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                                                                                <div>
                                                                                    <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-100">{quiz.title}</h4>
                                                                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">{quiz.questions.length} Fragen</p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex gap-2">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => { e.stopPropagation(); handleEdit(quiz); }}
                                                                                    className="p-2 text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-white/5 rounded-xl transition-all"
                                                                                    title="Bearbeiten"
                                                                                >
                                                                                    <Pencil size={16} />
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => { e.stopPropagation(); handleDelete(quiz.id); }}
                                                                                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-white/5 rounded-xl transition-all"
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
