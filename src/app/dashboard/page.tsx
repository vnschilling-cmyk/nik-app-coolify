"use client";

import { useState, useEffect } from "react";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, MessageCircleQuestion, Bookmark, TrendingUp, X, Save, HelpCircle, Trophy } from 'lucide-react';
import { pb } from "@/lib/pocketbase";

interface LastReadPosition {
    bookShortName: string;
    bookName: string;
    chapter: number;
}

interface Lesson {
    id: string;
    title: string;
    book_id: string;
    chapter_start: number;
    verse_start: number;
    verse_end: number;
}

import { useAuth } from "@/hooks/useAuth";

import { calculateGrade, getGradeColor } from "@/lib/grades";

const CATEGORIES = [
    { id: "bibeltext", label: "Bibeltext-Frage", icon: BookOpen, color: "indigo" },
    { id: "allgemein", label: "Allgemeine Frage", icon: HelpCircle, color: "emerald" },
];

export default function DashboardPage() {
    const { user } = useAuth();
    const [lastRead, setLastRead] = useState<LastReadPosition | null>(null);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [questionForm, setQuestionForm] = useState({
        question: "",
        lesson_id: "",
        category: "allgemein",
        verse_start: 1,
        verse_end: 1
    });
    const [saving, setSaving] = useState(false);
    const [maxVerses, setMaxVerses] = useState(50);

    const [memoryVerse, setMemoryVerse] = useState<any>(null);
    const [stats, setStats] = useState({
        personal: { last: 0, avg: 0, lastGrade: 0, avgGrade: 0 },
        group: { last: 0, avg: 0, lastGrade: 0, avgGrade: 0 }
    });

    useEffect(() => {
        // Load last read position
        const stored = localStorage.getItem('lastReadPosition');
        if (stored) {
            try {
                setLastRead(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse last read position:", e);
            }
        }
        loadMemoryVerse();
        loadStats();
    }, [user]);

    const loadStats = async () => {
        if (!user) return;
        try {
            const results = await pb.collection('quiz_results').getFullList({
                filter: `user="${user.id}"`,
                sort: '-created'
            });

            if (results.length > 0) {
                const last = results[0].percentage || 0;
                const lastGrade = results[0].grade || 0;
                const totalPct = results.reduce((acc, r) => acc + (r.percentage || 0), 0);
                const avg = Math.round(totalPct / results.length);
                const { grade: avgGrade } = calculateGrade(avg);

                setStats(s => ({
                    ...s,
                    personal: { last, avg, lastGrade, avgGrade }
                }));
            }
        } catch (e) {
            console.error("Error loading stats:", e);
        }
    };

    const loadMemoryVerse = async () => {
        try {
            const res = await pb.collection('memory_verses').getList(1, 1, {
                sort: '-created',
                expand: 'book_id'
            });
            if (res.items.length > 0) {
                setMemoryVerse(res.items[0]);
            }
        } catch (e) {
            console.error("Error loading memory verse:", e);
        }
    };

    useEffect(() => {
        // Load lessons when modal opens
        if (showQuestionModal && lessons.length === 0) {
            loadLessons();
        }
    }, [showQuestionModal]);

    // Update max verses when lesson changes (for bibeltext category)
    useEffect(() => {
        if (questionForm.lesson_id && questionForm.category === "bibeltext") {
            const lesson = lessons.find(l => l.id === questionForm.lesson_id);
            if (lesson && lesson.book_id) {
                updateMaxVerses(lesson);
            }
        }
    }, [questionForm.lesson_id, questionForm.category, lessons]);

    const loadLessons = async () => {
        try {
            const res = await pb.collection('lessons').getFullList({ sort: 'title' });
            setLessons(res.map(r => ({
                id: r.id,
                title: r.title || "(Ohne Titel)",
                book_id: r.book_id || "",
                chapter_start: r.chapter_start || 1,
                verse_start: r.verse_start || 1,
                verse_end: r.verse_end || 10
            })));
        } catch (e) {
            console.error("Failed to load lessons:", e);
        }
    };

    const updateMaxVerses = async (lesson: Lesson) => {
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
            setMaxVerses(lesson.verse_end || 50);
        }
    };

    const handleQuestionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!questionForm.question.trim() || !questionForm.lesson_id) return;

        setSaving(true);
        try {
            const data: any = {
                question: questionForm.question,
                category: questionForm.category,
                lesson_id: questionForm.lesson_id,
                is_answered: false,
                order: 0
            };

            if (questionForm.category === "bibeltext") {
                data.verse_start = questionForm.verse_start;
                data.verse_end = questionForm.verse_end;
            }

            await pb.collection('questions').create(data);
            setShowQuestionModal(false);
            setQuestionForm({ question: "", lesson_id: "", category: "allgemein", verse_start: 1, verse_end: 1 });
            alert("Frage wurde gespeichert!");
        } catch (e: any) {
            console.error("Failed to save question:", e);
            alert("Fehler: " + e.message);
        } finally {
            setSaving(false);
        }
    };

    const continueReadingLink = lastRead
        ? `/bible?book=${lastRead.bookShortName}&chapter=${lastRead.chapter}`
        : "/bible?book=Gen&chapter=1";

    const continueReadingLabel = lastRead
        ? `${lastRead.bookName} Kapitel ${lastRead.chapter}`
        : "1. Mose Kapitel 1";

    const selectedLesson = lessons.find(l => l.id === questionForm.lesson_id);

    return (
        <div className="min-h-screen pb-24">
            {/* Hero Section with Gradient */}
            {/* Hero Section with Logo */}
            <header className="px-6 pt-10 pb-6 bg-white dark:bg-zinc-950 overflow-hidden">
                <div className="flex flex-col gap-2">
                    <div className="w-full max-w-md mx-auto -my-3">
                        <Image
                            src="/logo.png"
                            alt="Nikodemos Logo"
                            width={500}
                            height={190}
                            className="w-full h-auto object-contain dark:invert"
                            priority
                        />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                            Shalom, {user?.name || ""}!
                        </h1>
                    </div>
                </div>
            </header>

            {/* Verse of the Day Card */}
            <section className="px-4 -mt-2 relative z-20">
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border-l-4 border-indigo-600 dark:border-indigo-400 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            {memoryVerse ? "Dein Lernvers" : "Vers des Tages"}
                        </span>
                    </div>
                    {memoryVerse ? (
                        <>
                            <p className="verse-text text-base text-slate-700 dark:text-slate-200 mb-2 font-light leading-relaxed italic">
                                „{memoryVerse.text}"
                            </p>
                            <p className="text-right text-sm font-semibold text-slate-500 dark:text-slate-400">
                                {memoryVerse.expand?.book_id?.name || "Bibel"} {memoryVerse.chapter}:{memoryVerse.verse_start}{memoryVerse.verse_end > memoryVerse.verse_start ? `-${memoryVerse.verse_end}` : ""}
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="verse-text text-base text-slate-700 dark:text-slate-200 mb-2 font-light leading-relaxed italic">
                                „Trachtet zuerst nach dem Reich Gottes und nach seiner Gerechtigkeit, so wird euch das alles zufallen."
                            </p>
                            <p className="text-right text-sm font-semibold text-slate-500 dark:text-slate-400">
                                Matthäus 6,33
                            </p>
                        </>
                    )}
                </div>
            </section>

            {/* Quick Stats */}
            <section className="px-4 mt-6">
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/30">
                        <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-1" />
                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">7</p>
                        <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-medium">Tage Streak</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800/30">
                        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-1" />
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">12</p>
                        <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 font-medium">Kapitel</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-xl p-3 border border-purple-100 dark:border-purple-800/30">
                        <Bookmark className="w-5 h-5 text-purple-600 dark:text-purple-400 mb-1" />
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">5</p>
                        <p className="text-[10px] text-purple-600/70 dark:text-purple-400/70 font-medium">Notizen</p>
                    </div>
                </div>
            </section>

            {/* Statistics Section */}
            <section className="px-4 mt-6">
                <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Deine Statistik</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Personal Stats */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Persönlich</span>
                            <Trophy size={16} className="text-amber-500" />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-center flex-1">
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {stats.personal.last ? `${stats.personal.last}%` : "--"}
                                </p>
                                <p className="text-[10px] text-zinc-500 uppercase">Letzter Test</p>
                                {stats.personal.lastGrade > 0 && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getGradeColor(stats.personal.lastGrade)}`}>
                                        Note {stats.personal.lastGrade}
                                    </span>
                                )}
                            </div>
                            <div className="w-px h-8 bg-zinc-100 dark:bg-zinc-800" />
                            <div className="text-center flex-1">
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {stats.personal.avg ? `${stats.personal.avg}%` : "--"}
                                </p>
                                <p className="text-[10px] text-zinc-500 uppercase">Schnitt</p>
                                {stats.personal.avgGrade > 0 && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getGradeColor(stats.personal.avgGrade)}`}>
                                        Note {stats.personal.avgGrade}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Group Stats */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm opacity-60">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Gruppe</span>
                            <TrendingUp size={16} className="text-emerald-500" />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-center flex-1">
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">-- %</p>
                                <p className="text-[10px] text-zinc-500 uppercase">Letzter Test</p>
                            </div>
                            <div className="w-px h-8 bg-zinc-100 dark:bg-zinc-800" />
                            <div className="text-center flex-1">
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">-- %</p>
                                <p className="text-[10px] text-zinc-500 uppercase">Schnitt</p>
                            </div>
                        </div>
                        <p className="text-[9px] text-center text-zinc-500 mt-2 uppercase tracking-tighter italic">In Vorbereitung (ChurchTools Sync)</p>
                    </div>
                </div>
            </section>

            {/* Quick Actions */}
            <section className="px-4 mt-6 space-y-3">
                <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Schnellzugriff</h3>

                <Link
                    href={continueReadingLink}
                    className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
                >
                    <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-indigo-700 dark:text-indigo-300" />
                    </div>
                    <div className="flex-1">
                        <p className="text-lg font-bold text-slate-900 dark:text-white">Weiterlesen</p>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">{continueReadingLabel}</p>
                    </div>
                    <span className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 transition-colors text-xl">›</span>
                </Link>

                <button
                    onClick={() => setShowQuestionModal(true)}
                    className="w-full flex items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all active:scale-[0.98] group text-left"
                >
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                        <MessageCircleQuestion className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />
                    </div>
                    <div className="flex-1">
                        <p className="text-lg font-bold text-slate-900 dark:text-white">Frage stellen</p>
                    </div>
                    <span className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-600 transition-colors text-xl">›</span>
                </button>
            </section>

            {/* Install Prompt */}
            <section className="px-4 mt-8">
                <InstallPrompt />
            </section>

            {/* Question Modal */}
            {showQuestionModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Neue Frage stellen</h3>
                            <button onClick={() => setShowQuestionModal(false)} className="text-zinc-400 hover:text-zinc-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleQuestionSubmit} className="space-y-4">
                            {/* Category Selector */}
                            <div>
                                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Kategorie *</label>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    {CATEGORIES.map(cat => {
                                        const Icon = cat.icon;
                                        const isSelected = questionForm.category === cat.id;
                                        const activeClass = cat.id === "bibeltext"
                                            ? "bg-indigo-100 text-indigo-700 border-indigo-500 ring-1 ring-indigo-500"
                                            : "bg-emerald-100 text-emerald-700 border-emerald-500 ring-1 ring-emerald-500";
                                        const inactiveClass = cat.id === "bibeltext"
                                            ? "bg-white text-indigo-600/70 border-zinc-200 hover:bg-indigo-50"
                                            : "bg-white text-emerald-600/70 border-zinc-200 hover:bg-emerald-50";

                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setQuestionForm({ ...questionForm, category: cat.id })}
                                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${isSelected ? activeClass : inactiveClass}`}
                                            >
                                                <Icon size={18} />
                                                <span className="text-sm font-medium">{cat.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Lesson Selector */}
                            <div>
                                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Lektion *</label>
                                <select
                                    required
                                    value={questionForm.lesson_id}
                                    onChange={e => setQuestionForm({ ...questionForm, lesson_id: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                                >
                                    <option value="">Lektion wählen...</option>
                                    {lessons.map(l => (
                                        <option key={l.id} value={l.id}>{l.title}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Verse Range (only for bibeltext) */}
                            {questionForm.category === "bibeltext" && selectedLesson && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Von Vers</label>
                                        <select
                                            value={questionForm.verse_start}
                                            onChange={e => {
                                                const newVal = parseInt(e.target.value) || 1;
                                                setQuestionForm({
                                                    ...questionForm,
                                                    verse_start: newVal,
                                                    verse_end: Math.max(newVal, questionForm.verse_end)
                                                });
                                            }}
                                            className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                                        >
                                            {Array.from({ length: maxVerses }, (_, i) => i + 1).map(num => (
                                                <option key={num} value={num}>{num}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Bis Vers</label>
                                        <select
                                            value={questionForm.verse_end}
                                            onChange={e => setQuestionForm({ ...questionForm, verse_end: parseInt(e.target.value) || 1 })}
                                            className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                                        >
                                            {Array.from({ length: maxVerses }, (_, i) => i + 1).map(num => (
                                                <option key={num} value={num}>{num}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Question Text */}
                            <div>
                                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Deine Frage *</label>
                                <textarea
                                    required
                                    value={questionForm.question}
                                    onChange={e => setQuestionForm({ ...questionForm, question: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg min-h-[100px]"
                                    placeholder="Was möchtest du wissen?"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={saving || !questionForm.question.trim() || !questionForm.lesson_id}
                                className="w-full py-2.5 bg-amber-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={16} /> {saving ? "Speichern..." : "Frage absenden"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
