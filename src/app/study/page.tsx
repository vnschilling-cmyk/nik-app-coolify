"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import Link from "next/link";
import { BookOpen, ChevronRight, ChevronDown, Lightbulb, HelpCircle, GraduationCap, Scroll, Brain } from "lucide-react";

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
                lesson_id: r.lesson_id || ""
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
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Bibelstudium</h1>
                        <p className="text-sm text-zinc-500">Wähle eine Lektion zum Lesen</p>
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

                        // Sort lessons within groups by start_date
                        groups.forEach((groupLessons) => {
                            groupLessons.sort((a, b) => {
                                if (a.start_date && b.start_date) {
                                    return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
                                }
                                return (a.id > b.id) ? 1 : -1;
                            });
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
                                <section key={groupTitle} className="bg-slate-50 dark:bg-slate-700/40 rounded-xl overflow-hidden border border-zinc-200 dark:border-slate-600">
                                    <button
                                        onClick={() => toggleGroup(groupTitle)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        <h3 className={`text-sm font-bold uppercase tracking-wider ${isThemaGroup
                                            ? "text-purple-600 dark:text-purple-400"
                                            : isBookGroup
                                                ? "text-indigo-600 dark:text-indigo-400"
                                                : "text-zinc-600 dark:text-zinc-400"
                                            }`}>
                                            {groupTitle} <span className="text-zinc-400 text-xs ml-2 font-normal">({groupLessons.length})</span>
                                        </h3>
                                        {isCollapsed ? <ChevronRight size={20} className="text-zinc-400" /> : <ChevronDown size={20} className="text-zinc-400" />}
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
                                                            {lesson.category === "Thema" ? <Scroll size={16} /> : <BookOpen size={16} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className={`font-semibold text-sm ${isInactive ? "text-zinc-500 line-through" : "text-zinc-900 dark:text-white"}`}>
                                                                    {lesson.title}
                                                                </h4>
                                                                {isInactive && <span className="text-[10px] bg-zinc-200 dark:bg-slate-600 text-zinc-500 px-1.5 py-0.5 rounded">Inaktiv</span>}

                                                                {!isInactive && lessonFacts.length > 0 && (
                                                                    <span className="shrink-0 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                                                        <Lightbulb size={12} /> {lessonFacts.length}
                                                                    </span>
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
                                                                        <GraduationCap size={12} /> {quizzes.filter(q => q.lesson_id === lesson.id).length}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {lesson.content && (
                                                                <p className="text-xs text-zinc-500 truncate">{lesson.content.replace(/<[^>]*>?/gm, ' ')}</p>
                                                            )}
                                                        </div>
                                                        {!isInactive && <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-indigo-500 transition-colors" />}
                                                    </>
                                                );

                                                if (isInactive) {
                                                    return (
                                                        <div key={lesson.id} className="w-full text-left bg-zinc-100 dark:bg-slate-700/50 border border-zinc-200 dark:border-slate-600 rounded-lg p-3 flex items-center gap-3 opacity-60 cursor-not-allowed">
                                                            {content}
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <Link
                                                        key={lesson.id}
                                                        href={`/study/${lesson.id}`}
                                                        className="w-full text-left bg-white dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg p-3 flex items-center gap-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group"
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
