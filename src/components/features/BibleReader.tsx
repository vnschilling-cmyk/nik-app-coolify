"use client";

import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { LinkedLesson } from "@/lib/bible";

export interface VerseData {
    verse: number;
    text: string;
}

interface BibleReaderProps {
    verses: VerseData[];
    lessons?: LinkedLesson[];
    onWordClick: (word: string) => void;
}

export default function BibleReader({ verses, lessons = [], onWordClick }: BibleReaderProps) {
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
                setIsHeaderVisible(false);
            } else {
                setIsHeaderVisible(true);
            }
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Helper to render text with clickable words
    const renderInteractiveText = (text: string) => {
        const words = text.split(/(\s+|[.,;!?]+)/g); // Keep punctuation but separate
        return words.map((chunk, i) => {
            // If it's whitespace, just render it
            if (/^\s+$/.test(chunk)) return <span key={i}>{chunk}</span>;

            // If it's punctuation, render it non-clickable
            if (/^[.,;!?]+$/.test(chunk)) return <span key={i} className="text-zinc-500">{chunk}</span>;

            // It's a word
            return (
                <span
                    key={i}
                    onClick={() => onWordClick(chunk)}
                    className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded px-0.5 transition-colors select-none"
                >
                    {chunk}
                </span>
            );
        });
    };

    return (
        <article className="max-w-prose mx-auto px-4 py-6 text-lg leading-loose dark:text-zinc-200 font-serif relative">
            {verses.map((v) => {
                // Find lessons starting at this verse
                const currentLessons = lessons.filter(l => l.verse_start === v.verse);

                return (
                    <div key={v.verse} className="relative group">
                        <p className="mb-4 relative pr-8">
                            <span className="text-xs font-bold text-blue-500 mr-1 select-none align-top pt-1 inline-block">
                                {v.verse}
                            </span>
                            {renderInteractiveText(v.text)}
                        </p>

                        {/* Lesson Icons in Right Margin */}
                        {currentLessons.length > 0 && (
                            <div className="absolute right-0 top-1 flex flex-col gap-2 transform translate-x-2">
                                {currentLessons.map(lesson => (
                                    <Link
                                        key={lesson.id}
                                        href={`/study/${lesson.id}`}
                                        className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300 p-1.5 rounded-full shadow-sm hover:scale-110 transition-transform cursor-pointer"
                                        title={lesson.title}
                                    >
                                        <GraduationCap size={18} />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            <div className="h-20" />
        </article>
    );
}
