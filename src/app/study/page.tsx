"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import Link from "next/link";
import NextImage from "next/image";
import { BookOpen, ChevronRight, ChevronDown, Lightbulb, HelpCircle, GraduationCap, Trophy, Scroll, Brain, Languages, Quote, Sparkles, FileText } from "lucide-react";
import clsx from "clsx";

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
    active: boolean;
    start_date?: string;
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
    category: string;
    lesson_id: string;
    fact_kind?: string;
}

interface Question {
    id: string;
    lesson_id: string;
}

interface Quiz {
    id: string;
    lesson_id: string;
}

export default function StudyPage() {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [facts, setFacts] = useState<Fact[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [memoryVerses, setMemoryVerses] = useState<{ id: string, lesson_id: string }[]>([]);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        setCurrentUser(pb.authStore.model);
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [lessonsRes, factsRes, booksRes, questionsRes, memoryVersesRes, quizzesRes] = await Promise.all([
                pb.collection('lessons').getFullList({
                    sort: 'category,order,title'
                }),
                pb.collection('facts').getFullList({ sort: 'title' }),
                pb.collection('bible_books').getFullList({ sort: 'order' }),
                pb.collection('questions').getFullList({ fields: 'id,lesson_id' }),
                pb.collection('memory_verses').getFullList({ fields: 'id,lesson_id' }),
                pb.collection('quizzes').getFullList({ fields: 'id,lesson_id' })
            ]);

            const booksMap = new Map(booksRes.map(b => [b.id, { name: b.name, order: b.order }]));

            setLessons(lessonsRes.map(r => {
                const book = r.book_id ? booksMap.get(r.book_id) : null;
                return {
                    id: r.id,
                    title: r.title || "",
                    content: r.content || "",
                    category: r.category || "",
                    verse_ref: r.verse_ref || "",
                    book_id: r.book_id || "",
                    chapter_start: r.chapter_start || 1,
                    verse_start: r.verse_start || 1,
                    verse_end: r.verse_end || 10,
                    active: r.active ?? true,
                    start_date: r.start_date,
                    expand: {
                        book_id: book ? {
                            name: book.name,
                            order: book.order
                        } : undefined
                    }
                };
            }));

            setFacts(factsRes.map(r => ({
                id: r.id,
                title: r.title || "",
                category: r.category || "",
                lesson_id: r.lesson_id || "",
                fact_kind: r.fact_kind || ""
            })));

            setQuestions(questionsRes.map(r => ({
                id: r.id,
                lesson_id: r.lesson_id || ""
            })));

            setMemoryVerses(memoryVersesRes.map(r => ({
                id: r.id,
                lesson_id: r.lesson_id || ""
            })));

            setQuizzes(quizzesRes.map(r => ({
                id: r.id,
                lesson_id: r.lesson_id || ""
            })));
        } catch (e) {
            console.error("Failed to load data:", e);
        } finally {
            setLoading(false);
        }
    };

    const toggleGroup = (group: string) => {
        const newSet = new Set(collapsedGroups);
        if (newSet.has(group)) {
            newSet.delete(group);
        } else {
            newSet.add(group);
        }
        setCollapsedGroups(newSet);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Bibelstudium</h1>
                            <p className="text-sm text-zinc-500">Wähle eine Lektion zum Lesen</p>
                        </div>
                    </div>

                </div>
            </header>

            {/* Content */}
            <div className="p-4 space-y-4">
                {lessons.length === 0 ? (
                    <div className="text-center py-12">
                        <BookOpen className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-500 mb-4">Noch keine Lektionen vorhanden.</p>
                        <Link href="/setup" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                            Lektionen anlegen →
                        </Link>
                    </div>
                ) : (
                    (() => {
                        // Grouping Logic
                        const groups = new Map<string, Lesson[]>();
                        const isAdmin = currentUser?.role === 'leader';

                        lessons.forEach(lesson => {
                            // Filter removed: Inactive lessons should be visible but disabled

                            let key = lesson.category || "Allgemein";

                            // Check if lesson belongs to a book
                            if (lesson.expand?.book_id) {
                                key = lesson.expand.book_id.name;
                            } else if (lesson.category === "Thema") {
                                // Keep it as "Thema"
                            }

                            if (!groups.has(key)) {
                                groups.set(key, []);
                            }
                            groups.get(key)?.push(lesson);
                        });

                        // Sort lessons within groups by title
                        groups.forEach((groupLessons) => {
                            groupLessons.sort((a, b) => a.title.localeCompare(b.title, 'de', { numeric: true }));
                        });

                        // Convert to array and sort groups
                        const sortedGroups = Array.from(groups.entries()).sort((a, b) => {
                            const [keyA, lessonsA] = a;
                            const [keyB, lessonsB] = b;

                            const orderA = lessonsA[0].expand?.book_id ? lessonsA[0].expand.book_id.order : (lessonsA[0].category === "Thema" ? 1000 : 2000);
                            const orderB = lessonsB[0].expand?.book_id ? lessonsB[0].expand.book_id.order : (lessonsB[0].category === "Thema" ? 1000 : 2000);

                            if (orderA !== orderB) return orderA - orderB;
                            return keyA.localeCompare(keyB);
                        });

                        return sortedGroups.map(([groupTitle, groupLessons]) => {
                            const isBookGroup = !!groupLessons[0].expand?.book_id;
                            const isThemaGroup = groupLessons[0].category === "Thema";
                            const isCollapsed = collapsedGroups.has(groupTitle);

                            return (
                                <section key={groupTitle} className="bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/10 shadow-sm shadow-indigo-500/5 transition-all duration-300">
                                    <button
                                        onClick={() => toggleGroup(groupTitle)}
                                        className={clsx(
                                            "w-full flex items-center justify-between p-4 hover:bg-white/80 dark:hover:bg-white/10 transition-all group border-l-4",
                                            isThemaGroup ? "border-l-purple-500" : isBookGroup ? "border-l-indigo-500" : "border-l-zinc-300 dark:border-l-zinc-700"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={clsx(
                                                "w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110",
                                                isThemaGroup ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                                                    : isBookGroup ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                            )}>
                                                {isThemaGroup ? <Scroll size={16} /> : isBookGroup ? <BookOpen size={16} /> : <FileText size={16} />}
                                            </div>
                                            <h3 className={clsx(
                                                "text-sm font-bold uppercase tracking-wider",
                                                isThemaGroup ? "text-purple-700 dark:text-purple-300" : isBookGroup ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-700 dark:text-zinc-300"
                                            )}>
                                                {groupTitle} <span className="opacity-40 text-xs ml-1 font-medium italic">({groupLessons.length})</span>
                                            </h3>
                                        </div>
                                        {isCollapsed ? <ChevronRight size={18} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" /> : <ChevronDown size={18} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />}
                                    </button>

                                    {!isCollapsed && (
                                        <div className="p-2 space-y-2 border-t border-zinc-200 dark:border-slate-600">
                                            {groupLessons.map(lesson => {
                                                const lessonFacts = facts.filter(f => f.lesson_id === lesson.id);
                                                const lessonQuestions = questions.filter(q => q.lesson_id === lesson.id);

                                                const isInactive = !lesson.active;

                                                const content = (
                                                    <>
                                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 ${lesson.category === "Thema"
                                                            ? "bg-gradient-to-br from-purple-500 to-pink-600"
                                                            : "bg-gradient-to-br from-indigo-500 to-purple-600"
                                                            } ${isInactive ? "grayscale opacity-50" : ""}`}>
                                                            {lesson.category === "Thema" ? <Scroll size={16} /> : <GraduationCap size={16} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className={`font-semibold text-sm ${isInactive ? "text-zinc-500 line-through" : "text-zinc-900 dark:text-white"}`}>
                                                                    {lesson.title}
                                                                </h4>
                                                                {isInactive && <span className="text-[10px] bg-zinc-200 dark:bg-slate-600 text-zinc-500 px-1.5 py-0.5 rounded">Inaktiv</span>}

                                                                {!isInactive && (
                                                                    <>
                                                                        {lessonFacts.some(f => f.category === 'KI') && (
                                                                            <span className="shrink-0 flex items-center gap-1 text-xs text-indigo-500 animate-pulse-soft">
                                                                                <Sparkles size={12} /> KI
                                                                            </span>
                                                                        )}
                                                                        {lessonFacts.filter(f => (!f.fact_kind || f.fact_kind === 'info') && f.category !== 'KI').length > 0 && (
                                                                            <span className="shrink-0 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                                                                <Lightbulb size={12} /> {lessonFacts.filter(f => (!f.fact_kind || f.fact_kind === 'info') && f.category !== 'KI').length}
                                                                            </span>
                                                                        )}
                                                                        {lessonFacts.filter(f => f.fact_kind === 'word_study').length > 0 && (
                                                                            <span className="shrink-0 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                                                                <Languages size={12} /> {lessonFacts.filter(f => f.fact_kind === 'word_study').length}
                                                                            </span>
                                                                        )}
                                                                        {lessonFacts.filter(f => f.fact_kind === 'quote').length > 0 && (
                                                                            <span className="shrink-0 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                                                                                <Quote size={12} /> {lessonFacts.filter(f => f.fact_kind === 'quote').length}
                                                                            </span>
                                                                        )}
                                                                    </>
                                                                )}
                                                                {lessonQuestions.length > 0 && (
                                                                    <span className="shrink-0 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                                                        <HelpCircle size={12} /> {lessonQuestions.length}
                                                                    </span>
                                                                )}
                                                                {memoryVerses.filter(v => v.lesson_id === lesson.id).length > 0 && (
                                                                    <span className="shrink-0 flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400">
                                                                        <Brain size={12} /> {memoryVerses.filter(v => v.lesson_id === lesson.id).length}
                                                                    </span>
                                                                )}
                                                                {quizzes.filter(q => q.lesson_id === lesson.id).length > 0 && (
                                                                    <span className="shrink-0 flex items-center gap-1 text-xs text-fuchsia-600 dark:text-fuchsia-400">
                                                                        <Trophy size={11} /> {quizzes.filter(q => q.lesson_id === lesson.id).length}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {lesson.content && (
                                                                <p className="text-xs text-zinc-500 truncate">
                                                                    {lesson.content
                                                                        .replace(/<[^>]*>?/gm, ' ')
                                                                        .replace(/\[\/?(justify|hyphen|center|left|right)\]/g, '')
                                                                        .trim()}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {!isInactive && <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-indigo-500 transition-colors" />}
                                                    </>
                                                );

                                                if (isInactive) {
                                                    return (
                                                        <div key={lesson.id} className="w-full text-left bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg p-3 flex items-center gap-3 opacity-60 cursor-not-allowed">
                                                            {content}
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <Link
                                                        key={lesson.id}
                                                        href={`/study/${lesson.id}`}
                                                        className="w-full text-left bg-zinc-50 dark:bg-slate-400/10 dark:backdrop-blur-md border border-zinc-200 dark:border-white/10 rounded-lg p-3 flex items-center gap-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group"
                                                    >
                                                        {content}
                                                    </Link>
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
        </div>
    );
}
