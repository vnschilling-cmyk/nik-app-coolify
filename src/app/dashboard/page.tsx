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
import { StatsRing } from "@/components/ui/StatsRing";

const CATEGORIES = [
    { id: "bibeltext", label: "Bibeltext-Frage", icon: BookOpen, color: "indigo" },
    { id: "allgemein", label: "Allgemeine Frage", icon: HelpCircle, color: "emerald" },
];

export default function DashboardPage() {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
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
        setMounted(true);
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
            <header className="px-6 pt-6 pb-6 bg-background overflow-hidden">
                <div className="flex flex-col gap-2">
                    <div className="w-full max-w-md mx-auto -my-3 flex flex-col items-center">
                        {/* Light Mode Logo */}
                        <Image
                            src="/logo-light.png"
                            alt="Nikodemos Logo"
                            width={300}
                            height={124}
                            className="w-[300px] h-auto object-contain dark:hidden"
                            priority
                        />
                        {/* Dark Mode Logo */}
                        <Image
                            src="/logo-dark.png"
                            alt="Nikodemos Logo"
                            width={300}
                            height={124}
                            className="w-[300px] h-auto object-contain hidden dark:block"
                            priority
                        />
                    </div>

                </div>
            </header>

            {/* Verse of the Day Card */}
            <section className="px-4 mt-4 relative z-20">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border-l-4 border-indigo-600 dark:border-indigo-400 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            {memoryVerse ? "Dein Lernvers" : "Vers des Tages"}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 italic">
                            {memoryVerse ? (
                                memoryVerse.verse_ref || (
                                    <>
                                        {memoryVerse.expand?.book_id?.name || "Bibel"}
                                        {memoryVerse.chapter > 0 ? ` ${memoryVerse.chapter}:${memoryVerse.verse_start}${memoryVerse.verse_end > memoryVerse.verse_start ? `-${memoryVerse.verse_end}` : ""}` : ""}
                                    </>
                                )
                            ) : "Matthäus 6,33"}
                        </span>
                    </div>
                    <p className="memory-verse-text text-xl text-slate-700 dark:text-slate-200 mb-0">
                        „{memoryVerse ? memoryVerse.text : "Trachtet zuerst nach dem Reich Gottes und nach seiner Gerechtigkeit, so wird euch das alles zufallen."}"
                    </p>
                </div>
            </section>





            {/* Statistics Section */}
            <section className="px-4 mt-6">
                <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Deine Statistik</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Personal Stats */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                                {user?.name ? user.name.split(' ')[0] : "Persönlich"}
                            </span>
                            <Trophy size={16} className="text-amber-500" />
                        </div>
                        <div className="flex items-center justify-around gap-2 px-2">
                            <StatsRing
                                percentage={stats.personal.last}
                                label={stats.personal.lastGrade > 0 ? `${stats.personal.lastGrade}` : "--"}
                                subLabel="Letzter"
                                colorClass={stats.personal.lastGrade > 0 ? calculateGrade(stats.personal.last).color : "text-zinc-300"}
                                size={90}
                            />
                            <div className="w-px h-12 bg-zinc-100 dark:bg-slate-700" />
                            <StatsRing
                                percentage={stats.personal.avg}
                                label={stats.personal.avgGrade > 0 ? `${stats.personal.avgGrade}` : "--"}
                                subLabel="Schnitt"
                                colorClass={stats.personal.avgGrade > 0 ? calculateGrade(stats.personal.avg).color : "text-zinc-300"}
                                size={90}
                            />
                        </div>
                    </div>

                    {/* Group Stats */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Jugend Grünberg</span>
                            <TrendingUp size={16} className="text-emerald-500" />
                        </div>
                        <div className="flex items-center justify-around gap-2 px-2">
                            <StatsRing
                                percentage={82}
                                label="Note 2"
                                subLabel="Schnitt"
                                colorClass="text-emerald-500"
                                size={95}
                            />
                            <div className="w-px h-12 bg-zinc-100 dark:bg-zinc-800" />
                            <StatsRing
                                percentage={95}
                                label="Note 1"
                                subLabel="Top"
                                colorClass="text-indigo-500"
                                size={95}
                            />
                        </div>

                        {/* Participant Details */}
                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50 grid grid-cols-3 gap-2 text-center">
                            <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">12</p>
                                <p className="text-[9px] text-zinc-500 uppercase">Tests Gesamt</p>
                            </div>
                            <div className="border-x border-slate-100 dark:border-slate-700/50">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">8</p>
                                <p className="text-[9px] text-zinc-500 uppercase">Ø Teilnehmer</p>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">14</p>
                                <p className="text-[9px] text-zinc-500 uppercase">Letzter Test</p>
                            </div>
                        </div>

                        <p className="text-[9px] text-center text-zinc-500 mt-4 uppercase tracking-tighter italic">Testdaten (Echtzeit-Anbindung in Arbeit)</p>
                    </div>
                </div>
            </section>

            {/* Quick Actions */}
            <section className="px-4 mt-6 space-y-3">
                <h3 className="font-heading text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Schnellzugriff</h3>

                <Link
                    href={continueReadingLink}
                    className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
                >
                    <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-indigo-700 dark:text-indigo-300" />
                    </div>
                    <div className="flex-1">
                        <p className="font-heading text-lg text-slate-900 dark:text-white">Weiterlesen</p>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">{continueReadingLabel}</p>
                    </div>
                    <span className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 transition-colors text-xl">›</span>
                </Link>

                <button
                    onClick={() => setShowQuestionModal(true)}
                    className="w-full flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all active:scale-[0.98] group text-left"
                >
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                        <MessageCircleQuestion className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />
                    </div>
                    <div className="flex-1">
                        <p className="font-heading text-lg text-slate-900 dark:text-white">Frage stellen</p>
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
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
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
                                    className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg"
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
                                    className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg min-h-[100px]"
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
