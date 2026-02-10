import Link from "next/link";
import React from "react";
import clsx from "clsx";

interface RichTextDisplayProps {
    content: string;
    className?: string;
}

export default function RichTextDisplay({ content, className = "" }: RichTextDisplayProps) {
    if (!content) return null;

    // Detect if content is a pre-formatted HTML block (from AI or manual HTML)
    const isHtmlBlock = /^\s*<(div|p|section|article|header|footer|table|ul|ol|blockquote)(\s|>)/i.test(content);

    if (isHtmlBlock) {
        // Fix legacy "invisible text" issue: absolute white-ish classes should be darkened in light mode.
        // This ensures data saved with older, broken color logic remains visible.
        const fixedContent = content
            .replace(/text-zinc-100/g, 'text-zinc-800 dark:text-zinc-100')
            .replace(/text-zinc-200/g, 'text-zinc-700 dark:text-zinc-200')
            .replace(/text-slate-100/g, 'text-slate-800 dark:text-slate-100')
            .replace(/text-white\b/g, (match, offset, fullText) => {
                const prev = fullText.substring(Math.max(0, offset - 5), offset);
                return prev === "dark:" ? match : "text-zinc-800 dark:text-white";
            });

        return (
            <div
                className={`prose prose-sm prose-zinc dark:prose-invert max-w-none ${className}`}
                dangerouslySetInnerHTML={{ __html: fixedContent }}
            />
        );
    }

    // Helper to process inline text (bold, italic, etc.)
    const processText = (text: string) => {
        return text
            // HTML Escape (basic)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            // Restore intended HTML tags (only <u> for now)
            .replace(/&lt;u&gt;/g, "<u>").replace(/&lt;\/u&gt;/g, "</u>")
            // Bold
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            // Italic
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            // Links (basic)
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
    };

    // Block state trackers (global across multiple paragraphs)
    let globalJustified = false;
    let globalHyphenated = false;
    let globalAlignment: 'left' | 'center' | 'right' | null = null;

    const paragraphs = content.split(/\n\s*\n/);
    const elements: React.ReactNode[] = [];

    paragraphs.forEach((p, pIndex) => {
        let lines = p.split('\n');
        let processedLines: string[] = [];
        let currentList: JSX.Element[] = [];
        let listType: 'ul' | 'ol' | null = null;

        // Paragraph-level effective state (persists for the entire paragraph)
        let pJustified = globalJustified;
        let pHyphenated = globalHyphenated;
        let pAlignment = globalAlignment;

        lines.forEach((line, lIndex) => {
            const stripTagsAndTrack = (text: string) => {
                let t = text;
                // Opening tags: set global AND paragraph-effective state
                if (t.includes('[justify]')) { globalJustified = true; pJustified = true; t = t.replace('[justify]', ''); }
                if (t.includes('[hyphen]')) { globalHyphenated = true; pHyphenated = true; t = t.replace('[hyphen]', ''); }
                if (t.includes('[center]')) { globalAlignment = 'center'; pAlignment = 'center'; t = t.replace('[center]', ''); }
                if (t.includes('[right]')) { globalAlignment = 'right'; pAlignment = 'right'; t = t.replace('[right]', ''); }
                if (t.includes('[left]')) { globalAlignment = 'left'; pAlignment = 'left'; t = t.replace('[left]', ''); }

                // Closing tags: update global state (for NEXT paragraphs), 
                // but pJustified/etc. remains true for THIS paragraph.
                if (t.includes('[/justify]')) { globalJustified = false; t = t.replace('[/justify]', ''); }
                if (t.includes('[/hyphen]')) { globalHyphenated = false; t = t.replace('[/hyphen]', ''); }
                if (t.includes('[/center]') || t.includes('[/right]') || t.includes('[/left]')) {
                    globalAlignment = null;
                    t = t.replace(/\[\/(center|right|left)\]/g, '');
                }
                return t;
            };

            const getEffectiveStyles = (): React.CSSProperties => {
                const styles: React.CSSProperties = {};
                if (pJustified) {
                    styles.textAlign = 'justify';
                    styles.textJustify = 'inter-word';
                }
                if (pAlignment) styles.textAlign = pAlignment;
                if (pHyphenated) {
                    styles.hyphens = 'auto';
                    (styles as any).WebkitHyphens = 'auto';
                }
                return styles;
            };

            let cleanLine = stripTagsAndTrack(line);
            let trimCleanLine = cleanLine.trim();

            if (!trimCleanLine && currentList.length === 0) return;

            // 1. Headers
            if (trimCleanLine.startsWith('# ')) {
                elements.push(<h1 key={`h1-${pIndex}-${lIndex}`} style={getEffectiveStyles()} className="text-2xl font-bold mb-4 mt-6">{trimCleanLine.substring(2).trim()}</h1>);
                return;
            }
            if (trimCleanLine.startsWith('## ')) {
                elements.push(<h2 key={`h2-${pIndex}-${lIndex}`} style={getEffectiveStyles()} className="text-xl font-bold mb-3 mt-4">{trimCleanLine.substring(3).trim()}</h2>);
                return;
            }

            // 2. Horizontal Rule
            if (trimCleanLine === '---' || trimCleanLine === '***') {
                elements.push(<hr key={`hr-${pIndex}-${lIndex}`} className="my-6 border-zinc-200 dark:border-white/10" />);
                return;
            }

            // 3. Lists
            if (trimCleanLine.startsWith('- ') || /^\d+\.\s/.test(trimCleanLine)) {
                const isBullet = trimCleanLine.startsWith('- ');
                const type = isBullet ? 'ul' : 'ol';
                const text = isBullet ? trimCleanLine.substring(2) : trimCleanLine.replace(/^\d+\.\s/, '');

                if (listType !== type && currentList.length > 0) {
                    const ListTag = listType === 'ul' ? 'ul' : 'ol';
                    elements.push(
                        <ListTag key={`list-${pIndex}-${lIndex}`} style={getEffectiveStyles()} className={clsx("list-inside mb-4 space-y-1", listType === 'ul' ? "list-disc" : "list-decimal")}>
                            {currentList}
                        </ListTag>
                    );
                    currentList = [];
                }

                listType = type;
                currentList.push(<li key={`li-${pIndex}-${lIndex}`} dangerouslySetInnerHTML={{ __html: processText(text.trim()) }} />);
                return;
            }

            // Flush list if needed
            if (currentList.length > 0) {
                const ListTag = listType === 'ul' ? 'ul' : 'ol';
                elements.push(
                    <ListTag key={`list-flush-${pIndex}-${lIndex}`} style={getEffectiveStyles()} className={clsx("list-inside mb-4 space-y-1", listType === 'ul' ? "list-disc" : "list-decimal")}>
                        {currentList}
                    </ListTag>
                );
                currentList = [];
                listType = null;
            }

            // 4. Regular Line
            if (trimCleanLine) {
                processedLines.push(cleanLine.trim());
            }
        });

        // Final list flush for THIS paragraph
        if (currentList.length > 0) {
            const ListTag = listType === 'ul' ? 'ul' : 'ol';
            const styles: React.CSSProperties = {};
            if (pJustified) { styles.textAlign = 'justify'; styles.textJustify = 'inter-word'; }
            if (pAlignment) styles.textAlign = pAlignment;
            if (pHyphenated) { styles.hyphens = 'auto'; (styles as any).WebkitHyphens = 'auto'; }

            elements.push(
                <ListTag key={`list-end-${pIndex}`} style={styles} className={clsx("list-inside mb-4 space-y-1", listType === 'ul' ? "list-disc" : "list-decimal")}>
                    {currentList}
                </ListTag>
            );
        }

        // Final paragraph flush
        if (processedLines.length > 0) {
            const styles: React.CSSProperties = {};
            if (pJustified) {
                styles.textAlign = 'justify';
                styles.textJustify = 'inter-word';
            }
            if (pAlignment) styles.textAlign = pAlignment;
            if (pHyphenated) {
                styles.hyphens = 'auto';
                (styles as any).WebkitHyphens = 'auto';
            }

            elements.push(
                <p
                    key={`p-${pIndex}`}
                    className="mb-4 last:mb-0"
                    style={styles}
                    lang={pHyphenated ? "de" : undefined}
                    dangerouslySetInnerHTML={{ __html: processText(processedLines.join(' ')) }}
                />
            );
        }
    });

    return (
        <div className={clsx("prose prose-sm prose-zinc dark:prose-invert max-w-none", className)}>
            {elements}
        </div>
    );
}
