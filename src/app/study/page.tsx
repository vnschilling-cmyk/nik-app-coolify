"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import Link from "next/link";
import { BookOpen, ChevronRight, Lightbulb } from "lucide-react";

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
    category: string;
    lesson_id: string;
}

export default function StudyPage() {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [facts, setFacts] = useState<Fact[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [lessonsRes, factsRes, booksRes] = await Promise.all([
                pb.collection('lessons').getFullList({
                    sort: 'category,order,title'
                }),
                pb.collection('facts').getFullList({ sort: 'title' }),
                pb.collection('bible_books').getFullList({ sort: 'order' })
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
        } catch (e) {
            console.error("Failed to load data:", e);
        } finally {
            setLoading(false);
        }
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
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 px-4 py-4">
                <h1 className="text-xl font-bold">📚 Bibelstudium</h1>
                <p className="text-sm text-zinc-500 mt-1">Wähle eine Lektion zum Lesen</p>
            </header>

            {/* Content */}
            <div className="p-4 space-y-6">
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

                        lessons.forEach(lesson => {
                            let key = lesson.category || "Allgemein";

                            // Check if lesson belongs to a book
                            if (lesson.expand?.book_id) {
                                key = lesson.expand.book_id.name;
                            } else if (lesson.category === "Thema") {
                                // Keep it as "Thema" or group it, logic was fine
                            }

                            if (!groups.has(key)) {
                                groups.set(key, []);
                            }
                            groups.get(key)?.push(lesson);
                        });

                        // Convert to array and sort
                        const sortedGroups = Array.from(groups.entries()).sort((a, b) => {
                            const lessonA = a[1][0];
                            const lessonB = b[1][0];

                            const orderA = lessonA.expand?.book_id ? lessonA.expand.book_id.order : (lessonA.category === "Thema" ? 1000 : 2000);
                            const orderB = lessonB.expand?.book_id ? lessonB.expand.book_id.order : (lessonB.category === "Thema" ? 1000 : 2000);

                            if (orderA !== orderB) return orderA - orderB;
                            return a[0].localeCompare(b[0]);
                        });

                        return sortedGroups.map(([groupTitle, groupLessons]) => {
                            const isBookGroup = !!groupLessons[0].expand?.book_id;
                            const isThemaGroup = groupLessons[0].category === "Thema";

                            return (
                                <section key={groupTitle}>
                                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isThemaGroup
                                        ? "text-purple-500 dark:text-purple-400"
                                        : isBookGroup
                                            ? "text-indigo-500 dark:text-indigo-400"
                                            : "text-zinc-500 dark:text-zinc-400"
                                        }`}>
                                        {groupTitle}
                                    </h3>
                                    <div className="space-y-2">
                                        {groupLessons.map(lesson => {
                                            const lessonFacts = facts.filter(f => f.lesson_id === lesson.id);
                                            return (
                                                <Link
                                                    key={lesson.id}
                                                    href={`/study/${lesson.id}`}
                                                    className="w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group"
                                                >
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 ${lesson.category === "Thema"
                                                        ? "bg-gradient-to-br from-purple-500 to-pink-600"
                                                        : "bg-gradient-to-br from-indigo-500 to-purple-600"
                                                        }`}>
                                                        {lesson.category === "Thema" ? "📝" : "📖"}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-semibold text-zinc-900 dark:text-white truncate">{lesson.title}</h4>
                                                            {lessonFacts.length > 0 && (
                                                                <span className="shrink-0 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                                                    <Lightbulb size={12} /> {lessonFacts.length}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {lesson.content && (
                                                            <p className="text-xs text-zinc-500 truncate">{lesson.content.replace(/<[^>]*>?/gm, ' ')}</p>
                                                        )}
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover:text-indigo-500 transition-colors" />
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </section>
                            );
                        });
                    })()
                )}
            </div>
        </div>
    );
}
