"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import Link from "next/link";
import { ChevronLeft, FileText, Lightbulb, Image as ImageIcon, Video, Link as LinkIcon, Map as MapIcon, BookOpen } from "lucide-react";
import RichTextDisplay from "@/components/ui/RichTextDisplay";

const TYPE_ICONS: Record<string, any> = {
    text: FileText,
    image: ImageIcon,
    video: Video,
    link: LinkIcon,
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

export default function LessonDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;

    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [facts, setFacts] = useState<Fact[]>([]);
    const [verses, setVerses] = useState<Verse[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFact, setSelectedFact] = useState<Fact | null>(null);

    useEffect(() => {
        loadLessonData();
    }, [id]);

    const loadLessonData = async () => {
        setLoading(true);
        try {
            const lessonRes = await pb.collection('lessons').getOne(id, {
                expand: 'book_id'
            });

            const factsRes = await pb.collection('facts').getFullList({
                filter: `lesson_id="${id}"`,
                sort: 'title'
            });

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
                    </div>
                    <h1 className="text-lg font-bold truncate">{lesson.title}</h1>
                </div>
            </header>

            <div className="max-w-prose mx-auto p-4">
                {/* Fact Detail Popup */}
                {selectedFact && (
                    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setSelectedFact(null)}>
                        <div className="bg-amber-50 dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-lg shadow-xl border-2 border-amber-400 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-3 shrink-0">
                                <Lightbulb className="w-5 h-5" />
                                <span className="font-bold">Fakt</span>
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
                                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
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

                                            return (
                                                <div key={v.id} className="relative pl-0 md:pl-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-1">
                                                            <p className="text-lg text-zinc-800 dark:text-zinc-200 leading-loose">
                                                                <sup className="text-xs font-bold text-indigo-500 dark:text-indigo-400 mr-1 select-none">{v.verse}</sup>
                                                                <span dangerouslySetInnerHTML={{ __html: v.text }} />
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
            </div>
        </div>
    );
}
