"use client";

import { useState, useRef, useEffect } from "react";
import clsx from "clsx";

interface BibleReaderProps {
    text: string; // Plain text or structured content
    onWordClick: (word: string) => void;
}

export default function BibleReader({ text, onWordClick }: BibleReaderProps) {
    // Simple word splitting for demonstration - in production, this needs robust parsing (v/chapter numbers)
    const words = text.split(/\s+/);

    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const lastScrollY = useRef(0);

    // Scroll logic for hiding UI (Proof of concept)
    // In a real app, this state should probably lift to the Layout context
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
                // Scrolling down
                setIsHeaderVisible(false);
            } else {
                // Scrolling up
                setIsHeaderVisible(true);
            }
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <article className="max-w-prose mx-auto px-4 py-8 text-lg leading-relaxed dark:text-zinc-200">
            <div className="flex flex-wrap gap-1 leading-8">
                {words.map((word, index) => (
                    <span
                        key={index}
                        onClick={() => onWordClick(word.replace(/[.,;!?]/g, ""))}
                        className="cursor-pointer active:bg-blue-100 dark:active:bg-blue-900 rounded px-0.5 transition-colors select-none"
                    >
                        {word}
                    </span>
                ))}
            </div>

            {/* Spacer for bottom nav */}
            <div className="h-20" />
        </article>
    );
}
