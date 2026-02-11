"use client";

import { useState, useEffect } from "react";
import AskQuestionModal from "@/components/modals/AskQuestionModal";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, MessageCircleQuestion, Bookmark, TrendingUp, X, Save, HelpCircle, Trophy, MessagesSquare, CheckCircle2, Clock, AlertTriangle, Trash2, Users } from 'lucide-react';
import { pb } from "@/lib/pocketbase";

interface LastReadPosition {
    bookShortName: string;
    bookName: string;
    chapter: number;
}

import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";

import { calculateGrade, getGradeTendency } from "@/lib/grades";
import { StatsRing } from "@/components/ui/StatsRing";

/**
 *## Refactoring & UX: Bug-Reporting
 
- [x] "Fehler melden" Kachel vom Dashboard entfernen
- [x] "Fehler melden" Kachel zur Setup-Seite hinzufügen (für alle Nutzer)
- [x] `BugReportModal` in `SetupPage` integrieren
- [x] Schließen per Backdrop-Click ermöglicht
- [x] Bildvorschau klickbar gemacht (zum Ändern)
- [x] Bildvorschau-Hintergrund auf Dunkel gesetzt (App-Design)
- [x] Verwirrende Lupe durch Pointer ersetzt
 */
export default function DashboardPage() {
    const { user } = useAuth();
    const { canAccessSection, isLeader } = usePermissions();
    const [mounted, setMounted] = useState(false);
    const [lastRead, setLastRead] = useState<LastReadPosition | null>(null);
    const [showQuestionModal, setShowQuestionModal] = useState(false);

    // Removed redundant state for manual form handling
    // lessons, bibleBooks, questionForm, saving, maxVerses

    const [showMyQuestionsModal, setShowMyQuestionsModal] = useState(false);
    const [userQuestions, setUserQuestions] = useState<any[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<any>(null); // To handle editing from "My Questions"
    const [showParticipantsModal, setShowParticipantsModal] = useState(false);

    const [memoryVerse, setMemoryVerse] = useState<any>(null);
    const [stats, setStats] = useState({
        personal: { last: 0, avg: 0, lastGrade: 0, avgGrade: 0, totalTests: 0 },
        group: {
            avg: 0,
            top: 0,
            avgGrade: 0,
            topGrade: 0,
            totalTests: 0,
            avgParticipants: 0,
            lastTestParticipants: 0,
            participants: [] as { name: string; score: string }[],
            lessonRatio: 0,
            totalLessons: 0,
            totalUniqueParticipants: 0,
            lastTestAvg: 0
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
        if (showMyQuestionsModal) loadUserQuestions();
        console.log("[Dashboard] User changed, reloading stats. Role:", user?.role);
    }, [user]);

    // Removed loadBibleBooks as it's no longer needed here

    const loadStats = async () => {
        if (!user) return;
        try {
            // Persönliche Stats laden
            const personalResults = await pb.collection('quiz_results').getFullList({
                filter: `user="${user.id}"`,
                sort: '-created'
            });

            let personal = { last: 0, avg: 0, lastGrade: 0, avgGrade: 0, totalTests: 0 };
            if (personalResults.length > 0) {
                const last = personalResults[0].percentage || 0;
                const lastGrade = personalResults[0].grade || 0;
                const totalPct = personalResults.reduce((acc, r) => acc + (r.percentage || 0), 0);
                const avg = Math.round(totalPct / personalResults.length);
                const { grade: avgGrade } = calculateGrade(avg);
                const totalTests = personalResults.length;
                personal = { last, avg, lastGrade, avgGrade, totalTests };
            }

            // Alle Ergebnisse für Gruppen-Stats laden
            const allResults = await pb.collection('quiz_results').getFullList({
                sort: '-created',
                expand: 'user,quiz'
            });

            let group = {
                avg: 0,
                top: 0,
                avgGrade: 0,
                topGrade: 0,
                totalTests: 0,
                avgParticipants: 0,
                lastTestParticipants: 0,
                participants: [] as { name: string; score: string }[],
                lessonRatio: 0,
                totalLessons: 0,
                totalUniqueParticipants: 0,
                lastTestAvg: 0
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

                // Teilnehmer des letzten Tests sammeln (deduplicated by user ID)
                const uniqueParticipants = new Map<string, { name: string, score: string }>();

                allResults.forEach(r => {
                    if (r.quiz === lastQuizId && r.expand?.user?.name) {
                        const userId = r.user; // Use user ID for unique identification
                        // Only add if not already present (since results are sorted by -created, the first one is the latest)
                        if (!uniqueParticipants.has(userId)) {
                            uniqueParticipants.set(userId, {
                                name: r.expand.user.name as string,
                                score: (r.score !== undefined && r.total !== undefined) ? `${r.score}/${r.total}` : (r.percentage ? `${r.percentage}%` : "")
                            });
                        }
                    }
                });

                const lastTestParticipantsData = Array.from(uniqueParticipants.values())
                    .sort((a, b) => a.name.localeCompare(b.name));

                const lastTestParticipants = lastTestParticipantsData.length;

                // Teilnehmer Namen sammeln (eindeutig) für Durchschnitt (optional, falls benötigt, aber wir nutzen jetzt lastTestParticipantsData für die Liste)
                // Die Liste soll ja für den "Letzten Test" sein.

                // Letzter Test Durchschnitt berechnen
                const lastQuizResults = allResults.filter(r => r.quiz === lastQuizId);
                const lastTestAvg = Math.round(lastQuizResults.reduce((acc, r) => acc + (r.percentage || 0), 0) / (lastQuizResults.length || 1));

                // Eindeutige Lektionen an denen teilgenommen wurde
                const lessonIdsWithParticipation = new Set<string>();
                allResults.forEach(r => {
                    const lessonId = r.expand?.quiz?.lesson_id;
                    if (lessonId) {
                        lessonIdsWithParticipation.add(lessonId);
                    }
                });
                const totalLessonsWithParticipation = lessonIdsWithParticipation.size;

                // Eindeutige Teilnehmer insgesamt
                const allUniqueUsers = new Set(allResults.map(r => r.user));
                const totalUniqueParticipants = allUniqueUsers.size;

                const lessonRatio = totalUniqueParticipants > 0
                    ? parseFloat((totalLessonsWithParticipation / totalUniqueParticipants).toFixed(1))
                    : 0;

                group = {
                    avg,
                    top,
                    avgGrade,
                    topGrade,
                    totalTests: allResults.length,
                    avgParticipants,
                    lastTestParticipants,
                    participants: lastTestParticipantsData,
                    lessonRatio,
                    totalLessons: totalLessonsWithParticipation,
                    totalUniqueParticipants,
                    lastTestAvg
                };
            }

            setStats({ personal, group });
        } catch (e) {
            console.error("Error loading stats:", e);
        }
    };

    const loadUserQuestions = async () => {
        if (!user) return;
        setLoadingQuestions(true);
        try {
            const res = await pb.collection('questions').getFullList({
                filter: `user = "${user.id}"`,
                sort: '-created',
                expand: 'lesson_id,book_id'
            });
            setUserQuestions(res);
        } catch (e) {
            console.error("Error loading my questions:", e);
        } finally {
            setLoadingQuestions(false);
        }
    };

    const deleteQuestion = async (id: string) => {
        if (!confirm("Frage wirklich löschen?")) return;
        try {
            await pb.collection('questions').delete(id);
            setUserQuestions(prev => prev.filter(q => q.id !== id));
        } catch (e: any) {
            alert("Fehler beim Löschen: " + e.message);
        }
    };

    useEffect(() => {
        if (showMyQuestionsModal) {
            loadUserQuestions();
        }
    }, [showMyQuestionsModal]);

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

    // Removed loadLessons, updateMaxVerses, handleQuestionSubmit
    // Logic is now in AskQuestionModal

    const continueReadingLink = lastRead
        ? `/bible?book=${lastRead.bookShortName}&chapter=${lastRead.chapter}`
        : "/bible?book=Gen&chapter=1";

    const continueReadingLabel = lastRead
        ? `${lastRead.bookName} Kapitel ${lastRead.chapter}`
        : "1. Mose Kapitel 1";

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
                {mounted && (
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
                                        percentage={100}
                                        label={stats.personal.totalTests.toString()}
                                        subLabel="Tests"
                                        colorClass="text-indigo-500"
                                        size={90}
                                    />
                                    <div className="w-px h-12 bg-zinc-100 dark:bg-slate-700" />
                                    <StatsRing
                                        percentage={stats.personal.avg}
                                        label={stats.personal.avg > 0 ? `${stats.personal.avg}%` : "--"}
                                        subLabel="Schnitt"
                                        colorClass={stats.personal.avg > 0 ? calculateGrade(stats.personal.avg).color : "text-zinc-300"}
                                        size={90}
                                    />
                                </div>
                            </div>

                            {/* Group Stats */}
                            {canAccessSection("group_statistics") && (
                                <div className="bg-zinc-50 dark:bg-slate-400/10 dark:backdrop-blur-md rounded-xl p-4 border border-slate-200 dark:border-white/5 shadow-sm transition-all hover:shadow-md animate-fadeIn">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Jugend Grünberg</span>
                                        <TrendingUp size={16} className="text-emerald-500" />
                                    </div>
                                    <div className="flex items-center justify-around gap-2 px-2">
                                        <div>
                                            <StatsRing
                                                percentage={stats.group.avg}
                                                label={stats.group.avg > 0 ? `${stats.group.avg}%` : "--"}
                                                subLabel="Schnitt"
                                                gradeLabel={stats.group.avg > 0 ? getGradeTendency(stats.group.avg) : undefined}
                                                colorClass={stats.group.avgGrade > 0 ? calculateGrade(stats.group.avg).color : "text-zinc-300"}
                                                size={95}
                                            />
                                        </div>
                                        <div className="w-px h-12 bg-zinc-100 dark:bg-zinc-800" />
                                        <StatsRing
                                            percentage={stats.group.lastTestAvg}
                                            label={stats.group.lastTestAvg > 0 ? `${stats.group.lastTestAvg}%` : "--"}
                                            subLabel="Letzter Test"
                                            gradeLabel={stats.group.lastTestAvg > 0 ? getGradeTendency(stats.group.lastTestAvg) : undefined}
                                            colorClass={stats.group.lastTestAvg > 0 ? calculateGrade(stats.group.lastTestAvg).color : "text-zinc-300"}
                                            size={95}
                                        />
                                    </div>

                                    {/* Participant Details */}
                                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50 grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{stats.group.totalLessons} / {stats.group.totalUniqueParticipants}</p>
                                            <p className="text-[9px] text-zinc-500 uppercase">Lektionen / Teilnehmer</p>
                                        </div>
                                        <div className="border-x border-slate-100 dark:border-slate-700/50">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{stats.group.avgParticipants}</p>
                                            <p className="text-[9px] text-zinc-500 uppercase">Ø Teilnehmer</p>
                                        </div>
                                        <div
                                            onClick={() => isLeader() && setShowParticipantsModal(true)}
                                            className={`${isLeader() ? "cursor-pointer hover:bg-zinc-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors p-1 -m-1" : ""}`}
                                            title={isLeader() ? "Teilnehmerliste des letzten Tests anzeigen" : ""}
                                        >
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{stats.group.lastTestParticipants}</p>
                                            <p className="text-[9px] text-zinc-500 uppercase">Letzter Test</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Quick Actions */}
                {mounted && (
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

                        {!isLeader() && canAccessSection("dashboard_questions") && (
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setShowQuestionModal(true)}
                                    title="Frage stellen"
                                    className="flex flex-col items-center gap-2 bg-zinc-50 dark:bg-slate-400/10 dark:backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] group text-center animate-fadeIn"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                                        <MessageCircleQuestion className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />
                                    </div>
                                    <p className="font-heading text-sm font-bold text-slate-900 dark:text-white">Frage stellen</p>
                                </button>

                                <button
                                    onClick={() => setShowMyQuestionsModal(true)}
                                    title="Meine Fragen anzeigen"
                                    className="flex flex-col items-center gap-2 bg-zinc-50 dark:bg-slate-400/10 dark:backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] group text-center animate-fadeIn"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                                        <MessagesSquare className="w-6 h-6 text-indigo-700 dark:text-indigo-300" />
                                    </div>
                                    <p className="font-heading text-sm font-bold text-slate-900 dark:text-white">Meine Fragen</p>
                                    {userQuestions.some(q => !q.is_answered) && (
                                        <div className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full" />
                                    )}
                                </button>
                            </div>
                        )}
                    </section>
                )}

                {/* Install Prompt */}
                <section className="px-4 mt-8">
                    <InstallPrompt />
                </section>

                {/* Question Modal */}
                <AskQuestionModal
                    isOpen={showQuestionModal}
                    onClose={() => setShowQuestionModal(false)}
                    onSaved={() => {
                        // Optionally refresh questions if showing my questions
                        if (showMyQuestionsModal) loadUserQuestions();
                        alert("Deine Frage wurde gesendet!");
                    }}
                />
                {/* Edit Question Modal (for existing questions) */}
                <AskQuestionModal
                    isOpen={!!editingQuestion}
                    onClose={() => setEditingQuestion(null)}
                    title="Frage bearbeiten"
                    initialData={editingQuestion}
                    onSaved={() => {
                        loadUserQuestions();
                        alert("Änderungen gespeichert!");
                    }}
                />

                {/* My Questions Modal List */}
                {showMyQuestionsModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                                        <MessagesSquare className="text-indigo-600 dark:text-indigo-400" size={20} />
                                    </div>
                                    <h3 className="font-heading font-bold text-xl text-slate-900 dark:text-white">Meine Fragen</h3>
                                </div>
                                <button
                                    onClick={() => setShowMyQuestionsModal(false)}
                                    className="p-2 hover:bg-zinc-100 dark:hover:bg-slate-700 rounded-full transition-colors text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                                    title="Schließen"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {loadingQuestions ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-sm font-medium text-zinc-500">Lade deine Fragen...</p>
                                    </div>
                                ) : userQuestions.length === 0 ? (
                                    <div className="text-center py-12 px-6">
                                        <div className="w-16 h-16 bg-zinc-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <HelpCircle className="text-zinc-300" size={32} />
                                        </div>
                                        <p className="text-zinc-500 dark:text-zinc-400 font-medium">Du hast noch keine Fragen gestellt.</p>
                                        <button
                                            onClick={() => {
                                                setShowMyQuestionsModal(false);
                                                setShowQuestionModal(true);
                                            }}
                                            className="mt-4 text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline"
                                            title="Jetzt die erste Frage stellen"
                                        >
                                            Jetzt die erste Frage stellen
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {userQuestions.map((q: any) => (
                                            <div
                                                key={q.id}
                                                className="bg-zinc-50 dark:bg-slate-700/50 rounded-2xl p-5 border border-zinc-100 dark:border-white/5 transition-all hover:shadow-md cursor-pointer group hover:border-indigo-200 dark:hover:border-indigo-500/30"
                                                onClick={() => setEditingQuestion(q)}
                                                title="Anklicken zum Bearbeiten"
                                            >
                                                <div className="flex items-start justify-between gap-4 mb-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-[10px] font-black uppercase tracking-tight px-2 py-0.5 rounded-full ${q.category === 'bibeltext' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                                                                {q.category === 'bibeltext' ? 'Bibeltext' : 'Allgemein'}
                                                            </span>
                                                            {q.verse_ref && (
                                                                <span className="text-[10px] font-bold text-zinc-400 uppercase">{q.verse_ref}</span>
                                                            )}
                                                            {q.expand?.lesson_id && (
                                                                <span className="text-[10px] font-bold text-zinc-400 uppercase">• {q.expand.lesson_id.title}</span>
                                                            )}
                                                        </div>
                                                        <p className="text-slate-900 dark:text-white font-bold leading-snug">{q.question}</p>
                                                    </div>
                                                    <div className="shrink-0 flex items-center gap-1">
                                                        {q.is_answered ? (
                                                            <div className="bg-emerald-500/10 text-emerald-600 p-1 rounded-full" title="Beantwortet">
                                                                <CheckCircle2 size={18} />
                                                            </div>
                                                        ) : (
                                                            <div className="bg-amber-500/10 text-amber-600 p-1 rounded-full" title="Noch offen">
                                                                <Clock size={18} />
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteQuestion(q.id);
                                                            }}
                                                            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                                            title="Frage löschen"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {q.answer ? (
                                                    <div className="mt-4 pt-4 border-t border-zinc-200/60 dark:border-white/5">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">Antwort des Leiters:</p>
                                                        <p className="text-zinc-600 dark:text-slate-300 text-sm italic">{q.answer}</p>
                                                    </div>
                                                ) : (
                                                    <p className="mt-2 text-xs text-zinc-400 font-medium italic group-hover:text-indigo-500 transition-colors">Wartet auf eine Antwort... (Klicken zum Bearbeiten)</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {/* Participants Modal (Admin Only) */}
                {showParticipantsModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col max-h-[80vh]">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                                        <Users className="text-emerald-600 dark:text-emerald-400" size={20} />
                                    </div>
                                    <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">Teilnehmer ({stats.group.participants.length})</h3>
                                </div>
                                <button
                                    onClick={() => setShowParticipantsModal(false)}
                                    className="p-2 hover:bg-zinc-100 dark:hover:bg-slate-700 rounded-full transition-colors text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                                    title="Schließen"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {stats.group.participants.length > 0 ? (
                                    <div className="space-y-2">
                                        {stats.group.participants.map((p, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-slate-700/50 border border-zinc-100 dark:border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase">
                                                        {p.name.substring(0, 2)}
                                                    </div>
                                                    <span className="font-medium text-slate-700 dark:text-slate-200">{p.name}</span>
                                                </div>
                                                {p.score && (
                                                    <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">
                                                        {p.score}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-zinc-500 py-4">Keine Teilnehmer gefunden.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
