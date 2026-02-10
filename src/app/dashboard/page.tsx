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
import { usePermissions } from "@/hooks/usePermissions";

import { calculateGrade, getGradeColor } from "@/lib/grades";
import { StatsRing } from "@/components/ui/StatsRing";

const CATEGORIES = [
    { id: "bibeltext", label: "Bibeltext-Frage", icon: BookOpen, color: "indigo" },
    { id: "allgemein", label: "Allgemeine Frage", icon: HelpCircle, color: "emerald" },
];

export default function DashboardPage() {
    const { user } = useAuth();
    const { canAccessSection } = usePermissions();
    const [mounted, setMounted] = useState(false);
    const [lastRead, setLastRead] = useState<LastReadPosition | null>(null);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [bibleBooks, setBibleBooks] = useState<any[]>([]);
    const [questionForm, setQuestionForm] = useState({
        question: "",
        lesson_id: "",
        category: "allgemein",
        book_id: "",
        chapter: 1,
        verse_start: 1,
        verse_end: 1
    });
    const [saving, setSaving] = useState(false);
    const [maxVerses, setMaxVerses] = useState(50);

    const [memoryVerse, setMemoryVerse] = useState<any>(null);
    const [stats, setStats] = useState({
        personal: { last: 0, avg: 0, lastGrade: 0, avgGrade: 0 },
        group: {
            avg: 0,
            top: 0,
            avgGrade: 0,
            topGrade: 0,
            totalTests: 0,
            avgParticipants: 0,
            lastTestParticipants: 0
        }
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
        loadBibleBooks();
    }, [user]);

    const loadBibleBooks = async () => {
        try {
            const res = await pb.collection('bible_books').getFullList({ sort: 'order' });
            setBibleBooks(res);
        } catch (e) {
            console.error("Failed to load bible books:", e);
        }
    };

    const loadStats = async () => {
        if (!user) return;
        try {
            // Persönliche Stats laden
            const personalResults = await pb.collection('quiz_results').getFullList({
                filter: `user="${user.id}"`,
                sort: '-created'
            });

            let personal = { last: 0, avg: 0, lastGrade: 0, avgGrade: 0 };
            if (personalResults.length > 0) {
                const last = personalResults[0].percentage || 0;
                const lastGrade = personalResults[0].grade || 0;
                const totalPct = personalResults.reduce((acc, r) => acc + (r.percentage || 0), 0);
                const avg = Math.round(totalPct / personalResults.length);
                const { grade: avgGrade } = calculateGrade(avg);
                personal = { last, avg, lastGrade, avgGrade };
            }

            // Alle Ergebnisse für Gruppen-Stats laden
            const allResults = await pb.collection('quiz_results').getFullList({
                sort: '-created'
            });

            let group = {
                avg: 0,
                top: 0,
                avgGrade: 0,
                topGrade: 0,
                totalTests: 0,
                avgParticipants: 0,
                lastTestParticipants: 0
            };

            if (allResults.length > 0) {
                // Schnitt berechnen
                const totalPct = allResults.reduce((acc, r) => acc + (r.percentage || 0), 0);
                const avg = Math.round(totalPct / allResults.length);
                const { grade: avgGrade } = calculateGrade(avg);

                // Top Ergebnis (beste Note ist kleinste Zahl, z.B. 1)
                const sortedByPercentage = [...allResults].sort((a, b) => (b.percentage || 0) - (a.percentage || 0));
                const top = sortedByPercentage[0].percentage || 0;
                const topGrade = sortedByPercentage[0].grade || 0;

                // Teilnehmer-Statistiken
                // Wir zählen eindeutige Quiz-Teilnahmen (Quiz-ID + Datum/Uhrzeit oder einfach Quiz-ID bei Gruppenarbeiten)
                // Da quiz_results meist pro Benutzer pro Quiz ist, gruppieren wir nach Quiz-ID
                const quizGroups = new Map<string, Set<string>>();
                allResults.forEach(r => {
                    if (r.quiz) {
                        if (!quizGroups.has(r.quiz)) quizGroups.set(r.quiz, new Set());
                        quizGroups.get(r.quiz)?.add(r.user);
                    }
                });

                const totalParticipantsAcrossQuizzes = Array.from(quizGroups.values()).reduce((acc, set) => acc + set.size, 0);
                const avgParticipants = Math.round(totalParticipantsAcrossQuizzes / (quizGroups.size || 1));

                // Letzter Test Teilnehmer (vom aktuellsten Ergebnis)
                const lastQuizId = allResults[0].quiz;
                const lastTestParticipants = lastQuizId ? (quizGroups.get(lastQuizId)?.size || 0) : 0;

                group = {
                    avg,
                    top,
                    avgGrade,
                    topGrade,
                    totalTests: allResults.length,
                    avgParticipants,
                    lastTestParticipants
                };
            }

            setStats({ personal, group });
        } catch (e) {
            console.error("Error loading stats:", e);
        }
    };

    const loadMemoryVerse = async () => {
        try {
            const now = new Date().toISOString();

            // 1. Suche die aktuellste Lektion (vergangen oder heute)
            const latestLessons = await pb.collection('lessons').getList(1, 1, {
                filter: `start_date <= "${now}" && active = true`,
                sort: '-start_date',
                fields: 'id,title'
            });

            if (latestLessons.items.length > 0) {
                const lessonId = latestLessons.items[0].id;

                // 2. Suche den Lernvers für diese Lektion
                const verseRes = await pb.collection('memory_verses').getList(1, 1, {
                    filter: `lesson_id = "${lessonId}"`,
                    expand: 'book_id',
                    sort: '-created' // Falls es mehrere gibt, den neuesten
                });

                if (verseRes.items.length > 0) {
                    setMemoryVerse(verseRes.items[0]);
                    return;
                }
            }

            // Fallback: Einfach den neuesten Lernvers laden, falls keine passende Lektion/kein Vers gefunden wurde
            const fallbackRes = await pb.collection('memory_verses').getList(1, 1, {
                sort: '-created',
                expand: 'book_id'
            });
            if (fallbackRes.items.length > 0) {
                setMemoryVerse(fallbackRes.items[0]);
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
        if (!questionForm.question.trim()) return;
        if (questionForm.category === "bibeltext" && (!questionForm.book_id || !questionForm.chapter)) return;

        setSaving(true);
        try {
            const data: any = {
                question: questionForm.question,
                category: questionForm.category,
                lesson_id: questionForm.lesson_id,
                is_answered: false,
                user: user?.id,
                created_by_name: user?.name,
                order: 0
            };

            if (questionForm.category === "bibeltext") {
                data.book_id = questionForm.book_id;
                data.chapter = questionForm.chapter;
                data.verse_start = questionForm.verse_start;
                data.verse_end = questionForm.verse_end;
            }

            await pb.collection('questions').create(data);
            setShowQuestionModal(false);
            setQuestionForm({ question: "", lesson_id: "", category: "allgemein", book_id: "", chapter: 1, verse_start: 1, verse_end: 1 });
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
            {/* Header Section */}
            <header className="sticky top-0 z-40 bg-background px-4 py-4">
                <div className="flex items-center justify-center">
                    <div className="relative w-64 h-20">
                        <Image
                            src="/logo-dark.png"
                            alt="tApp Logo"
                            fill
                            className="object-contain dark:block hidden"
                            priority
                        />
                        <Image
                            src="/logo-light.png"
                            alt="tApp Logo"
                            fill
                            className="object-contain dark:hidden block"
                            priority
                        />
                    </div>
                </div>
            </header>

            <div className="p-4 space-y-6">
                {/* Verse of the Day Card */}
                <section className="relative z-20">
                    <div className="bg-zinc-50 dark:bg-slate-400/10 dark:backdrop-blur-md rounded-xl p-4 border-l-4 border-indigo-600 dark:border-indigo-400 shadow-sm transition-all hover:shadow-md dark:border-white/5">
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
                        <p className="memory-verse-text text-xl text-slate-700 dark:text-slate-200 mb-0 text-center">
                            „{memoryVerse ? memoryVerse.text : "Trachtet zuerst nach dem Reich Gottes und nach seiner Gerechtigkeit, so wird euch das alles zufallen."}"
                        </p>
                    </div>
                </section>





                {/* Statistics Section */}
                <section className="px-4 mt-6">
                    <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Deine Statistik</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Personal Stats */}
                        <div className="bg-zinc-50 dark:bg-slate-400/10 dark:backdrop-blur-md rounded-xl p-4 border border-slate-200 dark:border-white/5 shadow-sm transition-all hover:shadow-md">
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
                        {canAccessSection("group_statistics") && (
                            <div className="bg-zinc-50 dark:bg-slate-400/10 dark:backdrop-blur-md rounded-xl p-4 border border-slate-200 dark:border-white/5 shadow-sm transition-all hover:shadow-md">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Jugend Grünberg</span>
                                    <TrendingUp size={16} className="text-emerald-500" />
                                </div>
                                <div className="flex items-center justify-around gap-2 px-2">
                                    <StatsRing
                                        percentage={stats.group.avg}
                                        label={stats.group.avgGrade > 0 ? `Note ${stats.group.avgGrade}` : "--"}
                                        subLabel="Schnitt"
                                        colorClass={stats.group.avgGrade > 0 ? calculateGrade(stats.group.avg).color : "text-zinc-300"}
                                        size={95}
                                    />
                                    <div className="w-px h-12 bg-zinc-100 dark:bg-zinc-800" />
                                    <StatsRing
                                        percentage={stats.group.top}
                                        label={stats.group.topGrade > 0 ? `Note ${stats.group.topGrade}` : "--"}
                                        subLabel="Top"
                                        colorClass={stats.group.topGrade > 0 ? calculateGrade(stats.group.top).color : "text-zinc-300"}
                                        size={95}
                                    />
                                </div>

                                {/* Participant Details */}
                                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50 grid grid-cols-3 gap-2 text-center">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{stats.group.totalTests}</p>
                                        <p className="text-[9px] text-zinc-500 uppercase">Tests Gesamt</p>
                                    </div>
                                    <div className="border-x border-slate-100 dark:border-slate-700/50">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{stats.group.avgParticipants}</p>
                                        <p className="text-[9px] text-zinc-500 uppercase">Ø Teilnehmer</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{stats.group.lastTestParticipants}</p>
                                        <p className="text-[9px] text-zinc-500 uppercase">Letzter Test</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Quick Actions */}
                <section className="px-4 mt-6 space-y-3">
                    <h3 className="font-heading text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Schnellzugriff</h3>

                    <Link
                        href={continueReadingLink}
                        className="flex items-center gap-4 bg-zinc-50 dark:bg-slate-400/10 dark:backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
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

                    {canAccessSection("dashboard_questions") && (
                        <button
                            onClick={() => setShowQuestionModal(true)}
                            className="w-full flex items-center gap-4 bg-zinc-50 dark:bg-slate-400/10 dark:backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] group text-left"
                        >
                            <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                                <MessageCircleQuestion className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />
                            </div>
                            <div className="flex-1">
                                <p className="font-heading text-lg text-slate-900 dark:text-white">Frage stellen</p>
                            </div>
                            <span className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-600 transition-colors text-xl">›</span>
                        </button>
                    )}
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
                                <button
                                    onClick={() => setShowQuestionModal(false)}
                                    className="text-zinc-400 hover:text-zinc-600"
                                    aria-label="Schließen"
                                    title="Schließen"
                                >
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

                                            // Volltonfarben
                                            const activeClass = cat.id === "bibeltext"
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                                : "bg-emerald-600 text-white border-emerald-600 shadow-md";
                                            const inactiveClass = "bg-white dark:bg-slate-700 text-zinc-500 border-zinc-200 dark:border-slate-600 hover:bg-zinc-50 dark:hover:bg-slate-600";

                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setQuestionForm({ ...questionForm, category: cat.id })}
                                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${isSelected ? activeClass : inactiveClass}`}
                                                >
                                                    <Icon size={18} />
                                                    <span className="text-sm font-bold uppercase tracking-tight">{cat.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Bibeltext-Auswahl (nur für bibeltext) */}
                                {questionForm.category === "bibeltext" && (
                                    <div className="space-y-4 animate-fadeIn">
                                        <div>
                                            <label htmlFor="book_select" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">Bibelbuch *</label>
                                            <select
                                                id="book_select"
                                                required
                                                value={questionForm.book_id}
                                                onChange={e => setQuestionForm({ ...questionForm, book_id: e.target.value, chapter: 1 })}
                                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg text-sm"
                                            >
                                                <option value="">Buch wählen...</option>
                                                {bibleBooks.map(b => (
                                                    <option key={b.id} value={b.id}>{b.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label htmlFor="chapter_input" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">Kapitel *</label>
                                                <input
                                                    id="chapter_input"
                                                    type="number"
                                                    min="1"
                                                    required
                                                    value={questionForm.chapter}
                                                    onChange={e => setQuestionForm({ ...questionForm, chapter: parseInt(e.target.value) || 1 })}
                                                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="verse_start" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">Von Vers</label>
                                                <input
                                                    id="verse_start"
                                                    type="number"
                                                    min="1"
                                                    value={questionForm.verse_start}
                                                    onChange={e => setQuestionForm({ ...questionForm, verse_start: parseInt(e.target.value) || 1 })}
                                                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="verse_end" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">Bis Vers</label>
                                                <input
                                                    id="verse_end"
                                                    type="number"
                                                    min="1"
                                                    value={questionForm.verse_end}
                                                    onChange={e => setQuestionForm({ ...questionForm, verse_end: parseInt(e.target.value) || 1 })}
                                                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="lesson_select" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">Lektionsbezug (Optional)</label>
                                            <select
                                                id="lesson_select"
                                                value={questionForm.lesson_id}
                                                onChange={e => setQuestionForm({ ...questionForm, lesson_id: e.target.value })}
                                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg text-sm"
                                            >
                                                <option value="">Kein Lektionsbezug</option>
                                                {lessons.map(l => (
                                                    <option key={l.id} value={l.id}>{l.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Question Text */}
                                <div>
                                    <label htmlFor="question_textarea" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">Deine Frage *</label>
                                    <textarea
                                        id="question_textarea"
                                        required
                                        value={questionForm.question}
                                        onChange={e => setQuestionForm({ ...questionForm, question: e.target.value })}
                                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg min-h-[100px] text-sm"
                                        placeholder="Was möchtest du wissen?"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving || !questionForm.question.trim() || (questionForm.category === "bibeltext" && !questionForm.book_id)}
                                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <Save size={18} /> {saving ? "Speichern..." : "Frage absenden"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
