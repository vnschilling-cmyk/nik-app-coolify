"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchWorkbookData, WorkbookLesson } from "@/lib/workbook";
import { ChevronLeft, Printer, Eye, Settings as SettingsIcon, GripVertical, Check, X, RefreshCw, Maximize2, Minimize2, Type, ChevronRight, BookOpen, Plus, Minus, Image as ImageIcon, Video, Link2, MapPin, Youtube, ChevronDown, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, WholeWord, ChevronsLeftRight, Info, MessageSquare, Star, PenLine, Copy } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { projectFonts, getFontFamily } from "@/lib/fonts";

// Simple Markdown Parser
const MarkdownRenderer = ({ content, className, style, headerStyles }: { content: string, className?: string, style?: any, headerStyles?: any }) => {
    if (!content) return null;

    const hStyle = headerStyles ? `style="
        color: ${headerStyles.sectionTitleColor || '#6366f1'};
        font-size: ${headerStyles.sectionTitle}pt;
        font-family: ${getFontFamily(headerStyles.sectionTitleFont)};
        text-transform: uppercase;
        letter-spacing: 0.025em; /* tracking-wide */
        line-height: 1.2;
        font-weight: ${headerStyles.sectionTitleBold ? '800' : 'normal'};
        font-style: ${headerStyles.sectionTitleItalic ? 'italic' : 'normal'};
        text-decoration: ${headerStyles.sectionTitleUnderline ? 'underline' : 'none'};
        text-align: ${headerStyles.sectionTitleAlign || 'left'};
        margin-top: 0px;
        margin-bottom: 8px;
        display: block;
    "` : 'class="font-extrabold text-[#1e293b] text-sm !mb-2 mt-0 first:mt-0"';

    // Very basic markdown parsing
    let html = content
        .replace(/^### (.*$)\n?/gm, `<h5 ${hStyle}>$1</h5>`)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/__(.*?)__/g, '<u>$1</u>')
        .replace(/\[justify\]/g, '<div style="text-align: justify">')
        .replace(/\[\/justify\]/g, '</div>')
        .replace(/\[center\]/g, '<div style="text-align: center">')
        .replace(/\[\/center\]/g, '</div>')
        .replace(/\[right\]/g, '<div style="text-align: right">')
        .replace(/\[\/right\]/g, '</div>')
        .replace(/\n/g, '<br />')
        .replace(/^- (.*)/gm, '<li>$1</li>')
        .replace(/^\d+\. (.*)/gm, '<li>$1</li>');

    return (
        <div
            className={clsx("prose prose-sm max-w-none prose-p:my-0 prose-headings:my-0", className)}
            style={{ ...style, lineHeight: style?.lineHeight }}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};

// Inline Editor Component
const InlineEditor = ({
    value,
    isEditing,
    isActive,
    onEditToggle,
    onChange,
    multiline = false,
    className,
    style,
    markdown = false,
    children
}: {
    value: string,
    isEditing: string | null,
    isActive: boolean,
    onEditToggle: (active: boolean) => void,
    onChange: (val: string) => void,
    multiline?: boolean,
    className?: string,
    style?: any,
    markdown?: boolean,
    children?: React.ReactNode
}) => {
    if (isActive) {
        return (
            <div className="relative z-50 group/editor no-print">
                {multiline ? (
                    <textarea
                        autoFocus
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                onEditToggle(false);
                            }
                        }}
                        className={clsx(
                            "w-full p-4 border-2 border-indigo-600 rounded-xl shadow-[0_20px_50px_rgba(79,70,229,0.3)] focus:ring-4 focus:ring-indigo-500/20 bg-white text-zinc-900 transition-all",
                            className
                        )}
                        style={{ ...style, minHeight: '200px' }}
                        rows={8}
                    />
                ) : (
                    <input
                        autoFocus
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                // Handled by toolbar or parent
                            } else if (e.key === 'Escape') {
                                onEditToggle(false);
                            }
                        }}
                        className={clsx(
                            "w-full p-2 border-2 border-indigo-600 rounded-lg shadow-[0_20px_50px_rgba(79,70,229,0.3)] focus:ring-4 focus:ring-indigo-500/20 bg-white text-zinc-900 transition-all",
                            className
                        )}
                        style={style}
                    />
                )}
            </div>
        );
    }

    return (
        <div
            onClick={() => onEditToggle(true)}
            className={clsx("cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all rounded relative group/preview", className)}
            style={style}
        >
            {children ? children : (
                markdown ? (
                    <MarkdownRenderer content={value} style={style} headerStyles={style?.headerStyles} />
                ) : (
                    <div style={style}>{value}</div>
                )
            )}
            <div className="absolute top-0 -right-6 opacity-0 group-hover/preview:opacity-100 transition-opacity no-print">
                <Type size={14} className="text-indigo-400" />
            </div>
        </div>
    );
};

const SectionToolbar = ({
    type,
    fontSize,
    lineHeight,
    onScale,
    onLineHeight,
    isEditing,
    isAnyEditing,
    onSave,
    onCancel,
    bold,
    italic,
    underline,
    align,
    hyphens,
    onToggleStyle,
    onChangeStyle,
    layoutCorrection,
    onLayoutCorrection,
    onTogglePageBreak,
    hasPageBreak,
    answerLines,
    onAnswerLines,
    answerLineSpacing,
    onAnswerLineSpacing
}: {
    type: string,
    fontSize: number,
    lineHeight: number,
    onScale: (val: number) => void,
    onLineHeight: (val: number) => void,
    isEditing?: boolean,
    isAnyEditing?: boolean,
    onSave?: () => void,
    onCancel?: () => void,
    bold?: boolean,
    italic?: boolean,
    underline?: boolean,
    align?: 'left' | 'center' | 'right' | 'justify',
    hyphens?: boolean,
    onToggleStyle?: (style: 'bold' | 'italic' | 'underline' | 'hyphens') => void,
    onChangeStyle?: (style: 'align', value: string) => void,
    layoutCorrection?: number,
    onLayoutCorrection?: (val: number) => void,
    onTogglePageBreak?: () => void,
    hasPageBreak?: boolean,
    answerLines?: number,
    onAnswerLines?: (val: number) => void,
    answerLineSpacing?: number,
    onAnswerLineSpacing?: (val: number) => void
}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={clsx(
                "no-print absolute top-[-30px] right-2 transition-all duration-300 z-[100] flex flex-col gap-2 p-3 !bg-white dark:!bg-[#0f172a] !bg-opacity-100 backdrop-blur-none border-2 border-indigo-600 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] hover:scale-105 origin-top-right !overflow-visible pointer-events-auto",
                isEditing && "!top-[-15px] !right-0 -translate-y-full transform-none", // Fix: Position above block instead of off-screen right
                (isEditing || isHovered)
                    ? "opacity-100 visible pointer-events-auto"
                    : (isAnyEditing
                        ? "opacity-0 invisible pointer-events-none"
                        : "opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-300 delay-300 group-hover:delay-0")
            )}
        >
            {/* Page Break Toggle */}
            {onTogglePageBreak && (
                <div className="flex items-center justify-center border-b-2 border-zinc-100 dark:border-slate-800 pb-2 mb-1">
                    <button
                        onClick={onTogglePageBreak}
                        className={clsx(
                            "p-1.5 rounded-lg transition-all w-full flex items-center justify-center gap-2",
                            hasPageBreak
                                ? "bg-indigo-600 text-white shadow-md font-bold"
                                : "bg-zinc-50 dark:bg-slate-800 text-zinc-500 hover:bg-indigo-50 hover:text-indigo-600"
                        )}
                        title="Diesen Block auf die nächste Seite zwingen"
                    >
                        <ChevronDown size={14} strokeWidth={hasPageBreak ? 3 : 2} className={hasPageBreak ? "" : "opacity-50"} />
                        <span className="text-[10px] uppercase font-black tracking-wider">
                            {hasPageBreak ? 'Auf neuer Seite' : 'Seitenumbruch'}
                        </span>
                    </button>
                </div>
            )}

            {isEditing && (
                <div className="flex items-center justify-center gap-2 pb-2 mb-2 border-b-2 border-indigo-50 dark:border-slate-800">
                    <button
                        onClick={onCancel}
                        className="p-2 bg-red-500 text-white hover:bg-red-600 rounded-xl transition-all shadow-sm"
                        title="Abbrechen"
                    >
                        <X size={18} strokeWidth={3} />
                    </button>
                    <button
                        onClick={onSave}
                        className="p-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-lg transition-all"
                        title="Speichern"
                    >
                        <Check size={18} strokeWidth={3} />
                    </button>
                </div>
            )}

            <div className="flex flex-row gap-4 divide-x-2 divide-zinc-200 dark:divide-slate-700 relative">
                <div className="flex flex-col items-center gap-1.5 px-1">
                    <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Text</span>
                    <button
                        onClick={() => onScale(parseFloat((fontSize + 0.5).toFixed(1)))}
                        className="p-1.5 bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-lg transition-all"
                        title="Schrift vergrößern"
                    >
                        <Plus size={14} strokeWidth={3} />
                    </button>
                    <span className="text-xs font-black text-zinc-900 dark:text-white min-w-[2rem] text-center">{fontSize}</span>
                    <button
                        onClick={() => onScale(Math.max(6, parseFloat((fontSize - 0.5).toFixed(1))))}
                        className="p-1.5 bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-lg transition-all"
                        title="Schrift verkleinern"
                    >
                        <Minus size={14} strokeWidth={3} />
                    </button>
                </div>

                <div className="flex flex-col items-center gap-1.5 pl-4 pr-1">
                    <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Abstand</span>
                    <button
                        onClick={() => onLineHeight(parseFloat((lineHeight + 0.1).toFixed(1)))}
                        className="p-1.5 bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-lg transition-all"
                        title="Zeilenabstand vergrößern"
                    >
                        <Plus size={14} strokeWidth={3} />
                    </button>
                    <span className="text-xs font-black text-zinc-900 dark:text-white min-w-[2rem] text-center">{lineHeight}</span>
                    <button
                        onClick={() => onLineHeight(Math.max(1.0, parseFloat((lineHeight - 0.1).toFixed(1))))}
                        className="p-1.5 bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-lg transition-all"
                        title="Zeilenabstand verkleinern"
                    >
                        <Minus size={14} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* Formatting Options Wrapper */}
            {(onToggleStyle || onChangeStyle || onLayoutCorrection || type === 'question') && (
                <div className="flex flex-col gap-2 border-t-2 border-zinc-100 dark:border-slate-800 pt-2 mt-2">
                    {onToggleStyle && onChangeStyle && (
                        <>
                            <div className="flex items-center justify-between gap-1">
                                <button
                                    onClick={() => onToggleStyle('bold')}
                                    className={clsx("p-1.5 rounded-lg transition-all", bold ? "bg-indigo-600 text-white shadow-md" : "bg-zinc-50 dark:bg-slate-800 text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600")}
                                >
                                    <Bold size={14} strokeWidth={bold ? 3 : 2} />
                                </button>
                                <button
                                    onClick={() => onToggleStyle('italic')}
                                    className={clsx("p-1.5 rounded-lg transition-all", italic ? "bg-indigo-600 text-white shadow-md" : "bg-zinc-50 dark:bg-slate-800 text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600")}
                                >
                                    <Italic size={14} strokeWidth={italic ? 3 : 2} />
                                </button>
                                <button
                                    onClick={() => onToggleStyle('underline')}
                                    className={clsx("p-1.5 rounded-lg transition-all", underline ? "bg-indigo-600 text-white shadow-md" : "bg-zinc-50 dark:bg-slate-800 text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600")}
                                >
                                    <Underline size={14} strokeWidth={underline ? 3 : 2} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between gap-1 border-t border-zinc-100 dark:border-slate-800 pt-2">
                                <button
                                    onClick={() => onChangeStyle('align', 'left')}
                                    className={clsx("p-1.5 rounded-lg transition-all", align === 'left' ? "bg-indigo-600 text-white shadow-md" : "bg-zinc-50 dark:bg-slate-800 text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600")}
                                >
                                    <AlignLeft size={14} strokeWidth={2} />
                                </button>
                                <button
                                    onClick={() => onChangeStyle('align', 'center')}
                                    className={clsx("p-1.5 rounded-lg transition-all", align === 'center' ? "bg-indigo-600 text-white shadow-md" : "bg-zinc-50 dark:bg-slate-800 text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600")}
                                >
                                    <AlignCenter size={14} strokeWidth={2} />
                                </button>
                                <button
                                    onClick={() => onChangeStyle('align', 'right')}
                                    className={clsx("p-1.5 rounded-lg transition-all", align === 'right' ? "bg-indigo-600 text-white shadow-md" : "bg-zinc-50 dark:bg-slate-800 text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600")}
                                >
                                    <AlignRight size={14} strokeWidth={2} />
                                </button>
                                <button
                                    onClick={() => onChangeStyle('align', 'justify')}
                                    className={clsx("p-1.5 rounded-lg transition-all", align === 'justify' ? "bg-indigo-600 text-white shadow-md" : "bg-zinc-50 dark:bg-slate-800 text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600")}
                                >
                                    <AlignJustify size={14} strokeWidth={2} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between gap-1 border-t border-zinc-100 dark:border-slate-800 pt-2">
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Silbentrennung</span>
                                <button
                                    onClick={() => onToggleStyle('hyphens')}
                                    className={clsx("p-1.5 rounded-lg transition-all", hyphens ? "bg-indigo-600 text-white shadow-md" : "bg-zinc-50 dark:bg-slate-800 text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600")}
                                >
                                    <WholeWord size={14} strokeWidth={2} />
                                </button>
                            </div>
                        </>
                    )}

                    {onLayoutCorrection && typeof layoutCorrection === 'number' && type !== 'facts' && (
                        <div className="flex flex-col gap-1 border-t border-zinc-100 dark:border-slate-800 pt-2">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Layout</span>
                                <span className="text-[9px] font-bold text-zinc-500">{layoutCorrection > 0 ? '+' : ''}{layoutCorrection}px</span>
                            </div>
                            <input
                                type="range"
                                min="500"
                                max="1600"
                                step="10"
                                value={layoutCorrection}
                                onChange={(e) => onLayoutCorrection(parseInt(e.target.value))}
                                className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                title="Regler nach rechts schieben, um mehr Inhalt auf die Seite zu bringen."
                            />
                        </div>
                    )}

                    {type === 'question' && (
                        <div className="flex flex-col gap-2 border-t border-zinc-100 dark:border-slate-800 pt-2">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Antwort-Zeilen</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 font-black">
                                <button
                                    onClick={() => onAnswerLines && onAnswerLines(Math.max(1, (answerLines || 0) - 1))}
                                    className="bg-indigo-50 dark:bg-slate-800 p-1.5 border border-indigo-100 dark:border-slate-700 rounded-lg text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                    title="Weniger Zeilen"
                                >
                                    <Minus size={12} strokeWidth={4} />
                                </button>
                                <span className="min-w-[1.2rem] text-center text-xs text-zinc-900 dark:text-white">{answerLines}</span>
                                <button
                                    onClick={() => onAnswerLines && onAnswerLines(Math.min(15, (answerLines || 0) + 1))}
                                    className="bg-indigo-50 dark:bg-slate-800 p-1.5 border border-indigo-100 dark:border-slate-700 rounded-lg text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                    title="Mehr Zeilen"
                                >
                                    <Plus size={12} strokeWidth={4} />
                                </button>
                            </div>

                            <div className="flex justify-between items-center px-1 border-t border-zinc-100 dark:border-slate-800 pt-2 mt-1">
                                <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Zeilen-Abstand</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 font-black">
                                <button
                                    onClick={() => onAnswerLineSpacing && onAnswerLineSpacing(Math.max(0.5, (answerLineSpacing || 1.0) - 0.2))}
                                    className="bg-indigo-50 dark:bg-slate-800 p-1.5 border border-indigo-100 dark:border-slate-700 rounded-lg text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                    title="Zeilenabstand verringern"
                                >
                                    <Minus size={12} strokeWidth={4} />
                                </button>
                                <span className="min-w-[1.2rem] text-center text-xs text-zinc-900 dark:text-white">{(answerLineSpacing || 1.0).toFixed(1)}</span>
                                <button
                                    onClick={() => onAnswerLineSpacing && onAnswerLineSpacing((answerLineSpacing || 1.0) + 0.2)}
                                    className="bg-indigo-50 dark:bg-slate-800 p-1.5 border border-indigo-100 dark:border-slate-700 rounded-lg text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                    title="Zeilenabstand erhöhen"
                                >
                                    <Plus size={12} strokeWidth={4} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div >
    );
};

export default function WorkbookPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const ids = searchParams.get("ids")?.split(",") || [];

    const [loading, setLoading] = useState(true);
    const [lessons, setLessons] = useState<WorkbookLesson[]>([]);
    const [showSettings, setShowSettings] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [windowHeight, setWindowHeight] = useState(typeof window !== "undefined" ? window.innerHeight : 0);
    const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 0);
    const [editingField, setEditingField] = useState<{ lessonId: string, field: string, index?: number, tempValue: string } | null>(null);
    const [zoomMode, setZoomMode] = useState<'fit-page' | 'fit-width'>('fit-width');
    const [splitStrategy, setSplitStrategy] = useState<'paragraph' | 'sentence' | 'hyphens' | 'smart'>('sentence');

    // Per-Section Layout Adjustments (Key: lessonId-type-index-partIndex)
    const [sectionLayouts, setSectionLayouts] = useState<Record<string, number>>({});
    const [sectionHeights, setSectionHeights] = useState<Record<string, number>>({});
    const [saveAsDefault, setSaveAsDefault] = useState(false);

    useEffect(() => {
        // Load persistent defaults on mount
        const savedToggle = localStorage.getItem('workbook_creator_default_toggle');
        if (savedToggle === 'true') {
            setSaveAsDefault(true);
        }

        const savedDefaults = localStorage.getItem('workbook_creator_defaults');
        const savedRootOptions = localStorage.getItem('workbook_creator_options');

        setOptions(prev => {
            let next = { ...prev };

            if (savedDefaults) {
                try {
                    const parsed = JSON.parse(savedDefaults);
                    if (parsed && typeof parsed === 'object') {
                        next.styles = { ...next.styles, ...parsed };
                    }
                } catch (e) {
                    console.error("Failed to parse saved defaults", e);
                }
            }

            if (savedRootOptions) {
                try {
                    const parsed = JSON.parse(savedRootOptions);
                    if (parsed && typeof parsed === 'object') {
                        // Merge root level options but keep existing lessons/status if any
                        next = { ...next, ...parsed };
                    }
                } catch (e) {
                    console.error("Failed to parse saved root options", e);
                }
            }

            return next;
        });
    }, []);

    const getSectionKey = (lessonId: string, type: string, index: number = 0, partIndex: number = 0) => `${lessonId}-${type}-${index}-${partIndex}`;

    const updateLessonContent = (lessonId: string, field: string, value: string, index?: number) => {
        setLessons(prev => prev.map(l => {
            if (l.id === lessonId) {
                if (typeof index === 'number' && Array.isArray(l[field as keyof WorkbookLesson])) {
                    const fieldVal = l[field as keyof WorkbookLesson];
                    if (Array.isArray(fieldVal)) {
                        const arr = [...fieldVal];

                        if (field === 'memoryVerses') {
                            // Heuristic to split Verse and Text (Format: **VerseRef**\n\nText or **VerseRef**Text)
                            // We align with the addBlock format: **VERSE**\n\nTEXT
                            const match = value.match(/^\*\*([^*]+)\*\*([\s\S]*)$/);
                            if (match) {
                                arr[index] = { ...arr[index], verse: match[1], text: match[2].trim() };
                            } else {
                                // No bold section found -> Assume all is text, verse is empty
                                arr[index] = { ...arr[index], text: value, verse: '' };
                            }
                        } else if (field === 'facts' && value.includes('### ')) {
                            // Unified block save logic: Parse strictly on ### headers
                            // This ensures we don't split on numbered lists (e.g. "3. Key theme")
                            const blocks = value.split(/\n\n(?=### )|\n(?=### )/).filter(b => b.trim());
                            let factSeqIdx = index;

                            blocks.forEach(block => {
                                while (factSeqIdx < arr.length && arr[factSeqIdx].type && arr[factSeqIdx].type !== 'text') {
                                    factSeqIdx++;
                                }

                                if (factSeqIdx < arr.length) {
                                    if (block.startsWith('### ')) {
                                        const lines = block.split('\n');
                                        const title = lines[0].replace('### ', '').trim();
                                        const description = lines.slice(1).join('\n').trim();
                                        arr[factSeqIdx] = { ...arr[factSeqIdx], title, description };
                                        factSeqIdx++;
                                    }
                                }
                            });
                        } else {
                            arr[index] = { ...arr[index], [field === 'facts' ? 'description' : 'question']: value };
                        }

                        return { ...l, [field]: arr };
                    }
                }
                return { ...l, [field]: value };
            }
            return l;
        }));
    };

    const applyGlobalStyle = (type: 'fontSize' | 'font' | 'bold' | 'italic' | 'underline' | 'align', value: any) => {
        setOptions(prev => {
            const nextStyles = { ...prev.styles };
            const sections = ['title', 'intro', 'bible', 'facts', 'questions', 'memory'];

            sections.forEach(key => {
                if (type === 'fontSize') {
                    // Normalize font sizes based on a standard scale relative to 10pt
                    const baseSize = typeof value === 'number' ? value : 10;
                    if (key === 'title') (nextStyles as any)[key] = baseSize + 6; // 16
                    else if (key === 'intro' || key === 'bible' || key === 'facts') (nextStyles as any)[key] = baseSize; // 10
                    else if (key === 'questions') (nextStyles as any)[key] = baseSize + 1; // 11
                    else if (key === 'memory') (nextStyles as any)[key] = baseSize + 2; // 12
                    else if (key === 'quiz') (nextStyles as any)[key] = baseSize - 1; // 9

                    // Also update persistent sub-keys if they exist
                    if (key === 'facts') {
                        (nextStyles as any)['factsTextFontSize'] = baseSize;
                        (nextStyles as any)['factsLinkFontSize'] = baseSize;
                    }
                } else if (type === 'font') {
                    (nextStyles as any)[`${key}Font`] = value;
                } else {
                    (nextStyles as any)[`${key}${type.charAt(0).toUpperCase() + type.slice(1)}`] = value;
                }
            });

            return { ...prev, styles: nextStyles };
        });
    };

    const handleSaveEdit = () => {
        if (!editingField) return;
        updateLessonContent(editingField.lessonId, editingField.field, editingField.tempValue, editingField.index);
        setEditingField(null);
    };

    const handleCancelEdit = () => {
        setEditingField(null);
    };

    // Layout Controls
    const [options, setOptions] = useState({
        showBibleText: true,
        showFacts: true,
        showQuestions: true,
        showQuizzes: false,
        showMemoryVerses: true,
        showIntro: true,
        showNotes: false, // New Notes Section
        mediaFilters: {
            text: true,
            image: false,
            video: false,
            link: false,
            map: false
        },
        lineForAnswers: true,
        answerLines: 3,
        answerWidth: 100,
        fontSize: 10,
        splitStrategy: 'sentence' as 'sentence' | 'paragraph' | 'space',
        // Detailed Font Sizes
        styles: {
            title: 24, // Changed from 16
            titleLH: 1.2,
            titleFont: 'var(--font-montserrat-alternates)', // Changed from 'sans'
            titleBold: true, // Changed from false
            titleItalic: false,
            titleUnderline: false,
            titleAlign: 'center', // Changed from 'justify'
            titleHyphens: true,
            titleBorder: false,
            titleBorderColor: 'indigo-200',
            titleShadow: 'none',
            titlePadding: 2,
            titleWidth: 100,
            titleFill: 'none',
            titleMarginTop: 6,
            titleCorrection: 0,
            blockSpacing: 4, // Added global block spacing

            intro: 11, // Changed from 10
            introLH: 1.4,
            introFont: 'var(--font-quicksand)', // Changed from 'serif'
            introBold: false,
            introItalic: true,
            introUnderline: false,
            introAlign: 'justify',
            introHyphens: true,
            introBorder: false,
            introBorderColor: 'indigo-200',
            introShadow: 'none',
            introRadius: 'none',
            introPadding: 4,
            introWidth: 100,
            introFill: 'none',
            introMarginTop: 4,

            sectionTitle: 10,
            sectionTitleLH: 1.2,
            sectionTitleFont: 'var(--font-montserrat-alternates)',
            sectionTitleBold: true,
            sectionTitleItalic: false,
            sectionTitleUnderline: false,
            sectionTitleAlign: 'left',
            sectionTitleMT: 0,
            sectionTitleMB: 8,
            sectionTitleColor: '#6366f1', // Added Color

            bible: 10,
            bibleLH: 1.4,
            bibleFont: 'var(--font-quicksand)', // Changed from 'serif'
            bibleBold: false,
            bibleItalic: false, // Changed from true
            bibleUnderline: false,
            bibleAlign: 'justify',
            bibleHyphens: true,
            bibleBorder: false,
            bibleBorderColor: 'indigo-200',
            bibleShadow: 'none',
            bibleRadius: 'none',
            biblePadding: 4,
            bibleWidth: 100,
            bibleFill: 'bg-zinc-50',
            bibleMarginTop: 4,

            // Base Facts (defaults for text)
            facts: 10,
            factsLH: 1.3,
            factsFont: 'var(--font-quicksand)',
            factsBold: false,
            factsItalic: false,
            factsUnderline: false,
            factsAlign: 'justify',
            factsHyphens: true,
            factsBorder: false,
            factsBorderColor: 'indigo-200',
            factsShadow: 'none',
            factsRadius: 'none',
            factsPadding: 2,
            factsWidth: 100,
            factsFill: 'none',
            factsMarginTop: 4,
            factsHeader: 'Infos & Medien', // Default header

            // Fact Subtypes
            factsTextBorder: false,
            factsTextBorderColor: 'indigo-200',
            factsTextShadow: 'none',
            factsTextRadius: 'none',
            factsTextFont: 'var(--font-quicksand)',
            factsTextFontSize: 10, // Added explicit font size
            factsTextBold: false,
            factsTextItalic: false,
            factsTextUnderline: false,
            factsTextAlign: 'justify',
            factsTextPadding: 2,
            factsTextWidth: 100,
            factsTextFill: 'none',
            factsTextMarginTop: 4,

            factsImageBorder: false,
            factsImageBorderColor: 'indigo-200',
            factsImageShadow: 'none',
            factsImageRadius: 'md',
            factsImagePadding: 2,
            factsImageWidth: 100,
            factsImageFill: 'none',
            factsImageMarginTop: 4,

            factsVideoBorder: false,
            factsVideoBorderColor: 'indigo-200',
            factsVideoShadow: 'none',
            factsVideoRadius: 'md',
            factsVideoPadding: 2,
            factsVideoWidth: 100,
            factsVideoFill: 'none',
            factsVideoMarginTop: 4,

            factsLinkBorder: false,
            factsLinkBorderColor: 'indigo-200',
            factsLinkShadow: 'none',
            factsLinkRadius: 'md',
            factsLinkFont: 'var(--font-quicksand)',
            factsLinkFontSize: 10, // Added explicit font size
            factsLinkBold: false,
            factsLinkItalic: false,
            factsLinkUnderline: false,
            factsLinkAlign: 'justify',
            factsLinkPadding: 2,
            factsLinkWidth: 100,
            factsLinkFill: 'none',
            factsLinkMarginTop: 4,

            factsMapBorder: false,
            factsMapBorderColor: 'indigo-200',
            factsMapShadow: 'none',
            factsMapRadius: 'md',
            factsMapPadding: 2,
            factsMapWidth: 100,
            factsMapFill: 'none',
            factsMapMarginTop: 4,

            questions: 11,
            questionsLH: 1.4,
            questionsFont: 'var(--font-quicksand)',
            questionsBold: false,
            questionsItalic: false,
            questionsUnderline: false,
            questionsAlign: 'justify',
            questionsHyphens: true,
            questionsBorder: false,
            questionsBorderColor: 'indigo-200',
            questionsShadow: 'none',
            questionsRadius: 'none',
            questionsPadding: 2,
            questionsWidth: 100,
            questionsFill: 'none',
            questionsMarginTop: 4,
            questionsHeader: 'Fragen', // Default header
            answerLineSpacing: 1.5,

            quiz: 9,
            quizPadding: 2,
            quizWidth: 100,
            quizFill: 'none',
            quizMarginTop: 4,

            memory: 12,
            memoryLH: 1.5,
            memoryFont: 'var(--font-play)',
            memoryBold: false,
            memoryItalic: true,
            memoryUnderline: false,
            memoryAlign: 'center',
            memoryHyphens: true,
            memoryBorder: true,
            memoryBorderColor: 'indigo-200',
            memoryShadow: 'none',
            memoryRadius: 'xl',
            memoryPadding: 4,
            memoryWidth: 100,
            memoryFill: 'bg-indigo-50',
            memoryMarginTop: 4,

            // Notes
            notes: 11,
            notesLH: 1.4,
            notesFont: 'var(--font-quicksand)',
            notesBold: true, // Header defaults to bold like questions
            notesItalic: false,
            notesUnderline: false,
            notesAlign: 'left',
            notesBorder: false,
            notesBorderColor: 'indigo-200',
            notesShadow: 'none',
            notesRadius: 'none',
            notesPadding: 4,
            notesWidth: 100,
            notesFill: 'none',
            notesMarginTop: 4,
            notesHeader: 'Persönliche Notizen',
            notesLines: 5,
            notesLineSpacing: 1.5,
            notesAdditionalPages: 0,
            notesLinesExtra: 0,
            notesMarginTopExtra: 4,
        },
        layoutCorrection: 0, // Manual Override for pagination sensitivity (-50 to +50)
    });

    const renderStyleControls = (section: string | { key: string, label: string }, isSubItem = false) => {
        const key = typeof section === 'string' ? section : section.key;
        const label = typeof section === 'string' ? null : section.label;
        const prefix = key; // styles keys are like 'titleFont', 'factsImageBorder'

        // Mapping helpers
        const getStyle = (s: string) => (options.styles as any)[`${prefix}${s}`];
        // Handle explicit "FontSize" suffix for sub-items that have it (e.g. factsTextFontSize), otherwise fallback to base key like 'title' (which is the size)
        // If s is empty string '', it means we are getting the size.
        // For 'factsText', prefix is 'factsText'. If s is '', key becomes 'factsText'. BUT we initialized it as 'factsTextFontSize'.
        // So we need a special check for empty suffix to append 'FontSize' if the direct key doesn't exist as a number.
        const getSizeStyle = () => {
            // Main sections
            if (['title', 'intro', 'bible', 'facts', 'questions', 'memory', 'quiz', 'notes', 'sectionTitle'].includes(key)) {
                return (options.styles as any)[key];
            }
            // Sub sections with explicit FontSize key
            return (options.styles as any)[`${key}FontSize`] || 10;
        };

        const setStyle = (s: string, v: any) => {
            let actualKey = `${prefix}${s}`;

            // Handle Font Size for sub-sections
            if (s === '') {
                if (['title', 'intro', 'bible', 'facts', 'questions', 'memory', 'quiz', 'notes', 'sectionTitle'].includes(key)) {
                    actualKey = key;
                } else {
                    actualKey = `${key}FontSize`;
                }
            }

            handleStyleChange(s === '' ? 'fontSize' : s, v, key); // Use handleStyleChange to trigger persistence
        };

        return (
            <div className={clsx("space-y-3 p-3 rounded-xl", isSubItem ? "bg-zinc-50 dark:bg-slate-800/50" : "bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 shadow-lg")}>
                {label && <h5 className={clsx("font-bold text-zinc-500 uppercase tracking-wider mb-2", isSubItem ? "text-[10px]" : "text-xs")}>{label}</h5>}

                {/* Font Controls (Only for main text sections, or skip based on type if needed) */}
                {/* We apply font controls to all standard text sections. For media sub-types (image, video, map), font settings might not make sense, logic below filters them. */}
                {(!key.includes('Image') && !key.includes('Video') && !key.includes('Map')) && (
                    <>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <select
                                value={getStyle('Font') || 'var(--font-quicksand)'}
                                onChange={(e) => setStyle('Font', e.target.value)}
                                className={clsx("text-xs p-1.5 rounded bg-zinc-100 dark:bg-slate-800 border-none focus:ring-1 focus:ring-indigo-500")}
                            >
                                {projectFonts.map(font => (
                                    <option key={font.value} value={font.value}>{font.label}</option>
                                ))}
                            </select>

                            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-slate-800 rounded px-1">
                                <button onClick={() => setStyle('', getSizeStyle() - 1)} className="p-1 hover:bg-zinc-200 rounded" title="Schrift verkleinern"><Minus size={10} /></button>
                                <span className="text-xs font-bold flex-1 text-center">{getSizeStyle()}</span>
                                <button onClick={() => setStyle('', getSizeStyle() + 1)} className="p-1 hover:bg-zinc-200 rounded" title="Schrift vergrößern"><Plus size={10} /></button>
                            </div>

                        </div>
                        <div className="flex bg-zinc-100 dark:bg-slate-800 rounded-lg p-1 gap-1 mb-3">
                            <button onClick={() => setStyle('Bold', !getStyle('Bold'))} className={clsx("flex-1 p-1 rounded shadow-sm flex justify-center", getStyle('Bold') ? "bg-indigo-600 text-white" : "text-zinc-500")} title="Fett"><Bold size={12} /></button>
                            <button onClick={() => setStyle('Italic', !getStyle('Italic'))} className={clsx("flex-1 p-1 rounded shadow-sm flex justify-center", getStyle('Italic') ? "bg-indigo-600 text-white" : "text-zinc-500")} title="Kursiv"><Italic size={12} /></button>
                            <button onClick={() => setStyle('Underline', !getStyle('Underline'))} className={clsx("flex-1 p-1 rounded shadow-sm flex justify-center", getStyle('Underline') ? "bg-indigo-600 text-white" : "text-zinc-500")} title="Unterstrichen"><Underline size={12} /></button>
                            <div className="w-px bg-zinc-300 mx-1" />
                            <button onClick={() => setStyle('Align', 'left')} className={clsx("flex-1 p-1 rounded shadow-sm flex justify-center", getStyle('Align') === 'left' ? "bg-indigo-600 text-white" : "text-zinc-500")} title="Linksbündig"><AlignLeft size={12} /></button>
                            <button onClick={() => setStyle('Align', 'center')} className={clsx("flex-1 p-1 rounded shadow-sm flex justify-center", getStyle('Align') === 'center' ? "bg-indigo-600 text-white" : "text-zinc-500")} title="Zentriert"><AlignCenter size={12} /></button>
                            <button onClick={() => setStyle('Align', 'justify')} className={clsx("flex-1 p-1 rounded shadow-sm flex justify-center", getStyle('Align') === 'justify' ? "bg-indigo-600 text-white" : "text-zinc-500")} title="Blocksatz"><AlignJustify size={12} /></button>
                        </div>

                        {/* Spacing Controls for Headers */}
                        <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1">
                                <label className="text-[10px] text-zinc-400 block mb-1">Abstand Oben</label>
                                <div className="flex items-center gap-1">
                                    <input type="range" min="0" max="100" step="1" value={options.styles.sectionTitleMT || 0} onChange={(e) => handleStyleChange('MT', parseInt(e.target.value), 'sectionTitle')} className="flex-1 h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                                    <span className="text-[10px] text-zinc-500 w-4 text-right">{options.styles.sectionTitleMT || 0}</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] text-zinc-400 block mb-1">Abstand Unten</label>
                                <div className="flex items-center gap-1">
                                    <input type="range" min="0" max="50" step="1" value={options.styles.sectionTitleMB ?? 8} onChange={(e) => handleStyleChange('MB', parseInt(e.target.value), 'sectionTitle')} className="flex-1 h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                                    <span className="text-[10px] text-zinc-500 w-4 text-right">{options.styles.sectionTitleMB ?? 8}</span>
                                </div>
                            </div>
                        </div>

                        {/* Color Picker for Global Headers */}
                        {key === 'sectionTitle' && (
                            <div className="flex items-center justify-between mb-3 px-1">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Farbe</span>
                                <div className="flex gap-1.5">
                                    {[
                                        { id: '#6366f1', label: 'Indigo', bg: 'bg-indigo-500' },
                                        { id: '#000000', label: 'Schwarz', bg: 'bg-black' },
                                        { id: '#475569', label: 'Schiefer', bg: 'bg-slate-600' },
                                        { id: '#f43f5e', label: 'Rose', bg: 'bg-rose-500' },
                                        { id: '#10b981', label: 'Smaragd', bg: 'bg-emerald-500' },
                                        { id: '#f59e0b', label: 'Bernstein', bg: 'bg-amber-500' }
                                    ].map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => setStyle('Color', c.id)}
                                            className={clsx(
                                                "w-5 h-5 rounded-full border border-zinc-200 dark:border-white/10 shadow-sm transition-all hover:scale-110",
                                                c.bg,
                                                (getStyle('Color') || '#6366f1') === c.id && "ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900"
                                            )}
                                            title={c.label}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-slate-700">
                    <div className="flex justify-between items-center gap-2">
                        <span className="text-[10px] font-medium text-zinc-500 flex items-center gap-1"><Maximize2 size={10} /> Box-Innenabstand</span>
                        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-slate-800 rounded px-1">
                            <button onClick={() => setStyle('Padding', Math.max(0, (getStyle('Padding') ?? 2) - 1))} className="p-1 hover:bg-zinc-200 rounded" title="Verringern"><Minus size={10} /></button>
                            <span className="text-[10px] font-bold w-4 text-center">{getStyle('Padding') ?? 2}</span>
                            <button onClick={() => setStyle('Padding', Math.min(12, (getStyle('Padding') ?? 2) + 1))} className="p-1 hover:bg-zinc-200 rounded" title="Erhöhen"><Plus size={10} /></button>
                        </div>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                        <span className="text-[10px] font-medium text-zinc-500 flex items-center gap-1"><ChevronsLeftRight size={10} /> Außenabstand (oben)</span>
                        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-slate-800 rounded px-1">
                            <button onClick={() => setStyle('MarginTop', Math.max(0, (getStyle('MarginTop') ?? 4) - 1))} className="p-1 hover:bg-zinc-200 rounded" title="Verringern"><Minus size={10} /></button>
                            <span className="text-[10px] font-bold w-4 text-center">{getStyle('MarginTop') ?? 4}</span>
                            <button onClick={() => setStyle('MarginTop', Math.max(0, (getStyle('MarginTop') ?? 4) + 1))} className="p-1 hover:bg-zinc-200 rounded" title="Erhöhen"><Plus size={10} /></button>
                        </div>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                        <span className="text-[10px] font-medium text-zinc-500 flex items-center gap-1"><ChevronsLeftRight size={10} /> Box-Breite</span>
                        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-slate-800 rounded px-1">
                            <button onClick={() => setStyle('Width', Math.max(20, (getStyle('Width') ?? 100) - 5))} className="p-1 hover:bg-zinc-200 rounded" title="Verringern"><Minus size={10} /></button>
                            <span className="text-[10px] font-bold w-6 text-center">{getStyle('Width') ?? 100}%</span>
                            <button onClick={() => setStyle('Width', Math.min(100, (getStyle('Width') ?? 100) + 5))} className="p-1 hover:bg-zinc-200 rounded" title="Erhöhen"><Plus size={10} /></button>
                        </div>
                    </div>
                </div>

                {/* Graphic Elements: Border, Shadow, Radius */}
                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-slate-700">
                    {/* Border */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-[10px] font-medium text-zinc-500">
                            <input type="checkbox" checked={getStyle('Border') || false} onChange={(e) => setStyle('Border', e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                            Rahmen
                        </label>
                        {getStyle('Border') && (
                            <div className="flex gap-1">
                                {[
                                    { id: 'indigo-500', bg: 'bg-indigo-500' },
                                    { id: 'zinc-400', bg: 'bg-zinc-400' },
                                    { id: 'rose-500', bg: 'bg-rose-500' },
                                    { id: 'emerald-500', bg: 'bg-emerald-500' }
                                ].map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => setStyle('BorderColor', c.id)}
                                        className={clsx(
                                            "w-4 h-4 rounded-full border border-white/20 shadow-sm",
                                            c.bg,
                                            getStyle('BorderColor') === c.id && "ring-2 ring-offset-1 ring-offset-zinc-900 ring-white"
                                        )}
                                        title={c.id.split('-')[0]}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Fill */}
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-zinc-500">Füllung</span>
                        <div className="flex gap-1">
                            {[
                                { id: 'none', bg: 'bg-transparent border border-zinc-600', label: 'Ø' },
                                { id: 'white', bg: 'bg-white' },
                                { id: 'zinc-50', bg: 'bg-zinc-50' },
                                { id: 'indigo-50', bg: 'bg-indigo-50' },
                                { id: 'rose-50', bg: 'bg-rose-50' },
                                { id: 'emerald-50', bg: 'bg-emerald-50' }
                            ].map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => setStyle('Fill', c.id)}
                                    className={clsx(
                                        "w-4 h-4 rounded-full border border-white/20 shadow-sm flex items-center justify-center text-[8px] font-bold text-zinc-400",
                                        c.bg,
                                        getStyle('Fill') === c.id && "ring-2 ring-offset-1 ring-offset-zinc-900 ring-white"
                                    )}
                                    title={c.id}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Shadow */}
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-zinc-500">Schatten</span>
                        <div className="flex bg-zinc-100 dark:bg-slate-800 rounded p-0.5">
                            {['none', 'sm', 'md', 'lg'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStyle('Shadow', s)}
                                    className={clsx("px-1.5 py-0.5 text-[8px] rounded transition-colors", getStyle('Shadow') === s ? "bg-white dark:bg-slate-700 shadow text-indigo-600 font-bold" : "text-zinc-400 hover:text-zinc-600")}
                                >
                                    {s === 'none' ? 'Ø' : s.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Radius */}
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-zinc-500">Ecken</span>
                        <div className="flex bg-zinc-100 dark:bg-slate-800 rounded p-0.5">
                            {['none', 'sm', 'md', 'lg', 'xl'].map(r => (
                                <button
                                    key={r}
                                    onClick={() => setStyle('Radius', r)}
                                    className={clsx("px-1.5 py-0.5 text-[8px] rounded transition-colors", getStyle('Radius') === r ? "bg-white dark:bg-slate-700 shadow text-indigo-600 font-bold" : "text-zinc-400 hover:text-zinc-600")}
                                >
                                    {r === 'none' ? '0' : r === 'xl' ? 'XL' : r.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        'allgemein': true,
        'titel': false,
        'einführung': false,
        'bibeltext': false,
        'infos': false,
        'fragen': true,
        'lernvers': false,
        'antworten': true
    });

    const toggleSettingsSection = (key: string) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    useEffect(() => {
        const handleResize = () => {
            setWindowHeight(window.innerHeight);
            setWindowWidth(window.innerWidth);
        };
        window.addEventListener("resize", handleResize);
        if (ids.length > 0) {
            loadData();
        } else {
            setLoading(false);
        }
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Zoom-to-fit calculation (Dual Axis - Precision A5)
    const getScaleFactor = () => {
        // A5 at 96 DPI: 148mm = 559.37px, 210mm = 793.7px
        const PAGE_WIDTH = 559.37;
        const PAGE_HEIGHT = 793.7;

        // More aggressive space calculation for true wide fit
        const sidePadding = isFullscreen ? 12 : 44;
        const topPadding = isFullscreen ? 32 : 100;

        const availableWidth = Math.max(windowWidth - sidePadding, 300);
        const availableHeight = Math.max(windowHeight - topPadding, 300);

        const scaleH = availableHeight / PAGE_HEIGHT;
        const scaleW = availableWidth / PAGE_WIDTH;

        if (zoomMode === 'fit-width') {
            return Math.min(scaleW, 5.0);
        }

        if (isFullscreen) {
            return Math.min(scaleH, scaleW, 2.0);
        }
        return 1;
    };

    const scaleFactor = getScaleFactor();

    // State for manual page breaks
    const [sectionPageBreaks, setSectionPageBreaks] = useState<Record<string, boolean>>({});

    const togglePageBreak = (key: string) => {
        setSectionPageBreaks(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleStyleChange = (property: string, value: any, section: string) => {
        let key = (section === 'any' || !section) ? property : `${section}${property.charAt(0).toUpperCase() + property.slice(1)}`;
        if (property === 'fontSize') {
            // Handle special cases for main sections vs sub sections
            if (['title', 'intro', 'bible', 'facts', 'questions', 'memory', 'quiz', 'notes', 'sectionTitle'].includes(section)) {
                key = section;
            } else {
                key = `${section}FontSize`;
            }
        }
        if (property === 'lineHeight') key = `${section}LH`;

        setOptions((prev: any) => {
            const nextStyles = {
                ...prev.styles,
                [key]: value
            };

            // Persistence
            if (saveAsDefault) {
                try {
                    const currentDefaults = JSON.parse(localStorage.getItem('workbook_creator_defaults') || '{}');
                    currentDefaults[key] = value;
                    localStorage.setItem('workbook_creator_defaults', JSON.stringify(currentDefaults));
                } catch (e) {
                    console.error("Failed to save default", e);
                }
            }

            return {
                ...prev,
                styles: nextStyles
            };
        });
    };

    const handleStyleToggle = (property: string, section: string) => {
        const key = `${section}${property.charAt(0).toUpperCase() + property.slice(1)}`;
        setOptions((prev: any) => {
            const nextVal = !prev.styles[key];
            const nextStyles = {
                ...prev.styles,
                [key]: nextVal
            };

            // Persistence
            if (saveAsDefault) {
                try {
                    const currentDefaults = JSON.parse(localStorage.getItem('workbook_creator_defaults') || '{}');
                    currentDefaults[key] = nextVal;
                    localStorage.setItem('workbook_creator_defaults', JSON.stringify(currentDefaults));
                } catch (e) {
                    console.error("Failed to save default", e);
                }
            }

            return {
                ...prev,
                styles: nextStyles
            };
        });
    };

    // Pagination Logic: Dynamic Pixel-Based Calculation
    // Pagination Constants
    const PAGE_HEIGHT_PX = 793;
    const MARGIN_Y_PX = 114; // Synchronized with 15mm top + 15mm bottom padding
    const SECTION_SPACING_PX = 16;
    const ITEM_SPACING_PX = 12;

    const effectiveBuffer = 5 - options.layoutCorrection;
    const CONTENT_HEIGHT_PX = PAGE_HEIGHT_PX - MARGIN_Y_PX - effectiveBuffer;
    const CONTENT_WIDTH_PX = 440;

    // Helper to estimate height
    const measureContentHeight = (text: string, fontSize: number, lineHeight: number, isBold: boolean, type: string, correctionPx: number = 0, partIndex: number = 0) => {
        if (!text) return 0;
        const styles = options.styles as any;
        let styleKey = type;
        if (['intro', 'bible', 'title', 'memory', 'questions', 'quiz', 'notes', 'sectionTitle'].includes(type)) {
            styleKey = type;
        } else {
            if (['text', 'image', 'video', 'link', 'map'].includes(type)) {
                styleKey = `facts${type.charAt(0).toUpperCase() + type.slice(1)}`;
            }
        }
        const subtypeMap: any = {
            'text': 'factsText', 'image': 'factsImage', 'video': 'factsVideo',
            'yt': 'factsVideo', 'link': 'factsLink', 'map': 'factsMap', 'facts': 'facts'
        };
        if (subtypeMap[type]) styleKey = subtypeMap[type];
        else styleKey = 'facts';

        const paddingScale = styles[`${styleKey}Padding`] ?? 2;
        const widthPercent = styles[`${styleKey}Width`] ?? 100;
        const verticalPaddingPx = paddingScale * 0.25 * 16 * 2;
        const horizontalPaddingPx = paddingScale * 0.25 * 16 * 2;
        const boxWidth = CONTENT_WIDTH_PX * (widthPercent / 100);
        const textWidth = boxWidth - horizontalPaddingPx;
        const charWidth = fontSize * (isBold ? 0.68 : 0.58);
        const effectiveTextWidth = Math.max(50, textWidth);
        const charsPerLine = Math.floor(effectiveTextWidth / charWidth);

        const paragraphs = text.split('\n');
        let totalLines = 0;
        paragraphs.forEach((p: string) => {
            const pLen = p.length;
            if (pLen === 0) { totalLines += 1.0; return; }
            let lineCount = 0;
            if (p.startsWith('###')) {
                const headerLH = styles.sectionTitleLH || 1.2;
                const headerFS = styles.sectionTitle || 14;
                const headerHeightPx = (headerFS * 1.33 * headerLH) + 16;
                totalLines += (headerHeightPx / (fontSize * 1.33 * lineHeight));
            } else {
                lineCount = Math.ceil(pLen / charsPerLine);
            }
            totalLines += lineCount;
        });
        const lineHeightPx = fontSize * 1.33 * lineHeight;
        let height = (totalLines * lineHeightPx) - correctionPx;
        height += verticalPaddingPx;
        // Important: Match the renderer's sub-header spacing (MT 16px + FS + MB 8px approx)
        if (type === 'facts' && partIndex === 0) height += ((styles.sectionTitleMT ?? 16) + (styles.sectionTitle || 10) * 1.33 + (styles.sectionTitleMB ?? 8));
        return Math.max(10, height);
    };

    const splitTextForHeight = (text: string, availableHeight: number, fontSize: number, lineHeight: number, isBold: boolean, isGreedy: boolean = false, correctionPx: number = 0, type: string = 'text', partIndex: number = 0) => {
        const targetHeight = isGreedy ? availableHeight : availableHeight - 2;
        if (targetHeight <= 0) return { fit: '', remainder: text };
        let low = 0, high = text.length, splitIdx = 0;
        while (low <= high) {
            let mid = Math.floor((low + high) / 2);
            if (measureContentHeight(text.substring(0, mid), fontSize, lineHeight, isBold, type, correctionPx, partIndex) <= targetHeight) {
                splitIdx = mid; low = mid + 1;
            } else { high = mid - 1; }
        }
        let finalIdx = splitIdx;
        if (finalIdx < text.length) {
            const lastSpace = text.lastIndexOf(' ', finalIdx);
            const lastNewline = text.lastIndexOf('\n', finalIdx);
            const lastSentence = Math.max(text.lastIndexOf('. ', finalIdx), text.lastIndexOf('? ', finalIdx), text.lastIndexOf('! ', finalIdx));
            let bestBreak = Math.max(lastSpace, lastNewline);
            const currentStrategy = options.splitStrategy || 'sentence';
            if (!isGreedy) {
                if (currentStrategy === 'paragraph' && lastNewline !== -1) bestBreak = lastNewline;
                else if (currentStrategy === 'sentence' && lastSentence !== -1) bestBreak = lastSentence;
            }
            const threshold = isGreedy ? 0.90 : (currentStrategy === 'sentence' ? 0.40 : 0.60);
            if (bestBreak !== -1 && bestBreak > finalIdx * threshold) finalIdx = bestBreak;
        }
        const fitText = text.substring(0, finalIdx);
        const orphanMatch = fitText.match(/(\s|\n)\d+\.\s*$/);
        if (orphanMatch) finalIdx -= orphanMatch[0].length;
        if (orphanMatch) {
            finalIdx -= orphanMatch[0].length;
        }

        return {
            fit: text.substring(0, finalIdx).trim(),
            remainder: text.substring(finalIdx).trim()
        };
    };

    const getWorkbookPages = () => {
        const pages: { lesson: WorkbookLesson, sections: any[], pageNum: number }[] = [];

        lessons.forEach((lesson) => {
            let currentPageSections: any[] = [];
            let pageNum = 1;
            let currentHeight = 0;

            const pushPage = () => {
                if (currentPageSections.length > 0) {
                    // Mark the very last section of the page as 'isLastOnPage'
                    currentPageSections[currentPageSections.length - 1].isLastOnPage = true;

                    pages.push({ lesson, sections: [...currentPageSections], pageNum });
                    currentPageSections = [];
                    pageNum++;
                    currentHeight = 0;
                }
            };

            const addBlock = (type: string, content: string, fieldName: string, meta: any = {}, style: any = {}) => {
                if (!content && type !== 'image' && type !== 'video') return;

                // Check Force Page Break
                // Only for the FIRST part of a split block (partIndex is handled dynamically inside the loop below, but we check specific key)
                // Actually, addBlock processes the WHOLE block content at once and splits it.
                // So checking here is correct for "Start on new page".
                const sKey = getSectionKey(lesson.id, fieldName, meta.fIdx || 0, 0);
                // Note: meta.fIdx is 0 for non-array fields (title, intro), but facts/questions have specific indices.
                // Titles/Intro usually don't have multiple indices, so 0 is fine.

                if (sectionPageBreaks[sKey]) {
                    pushPage();
                }

                // Parse styles specific to this section type
                const fs = style[`${type}`] || 10;
                const lh = style[`${type}LH`] || 1.4;
                const bold = style[`${type}Bold`] || false;

                const measureType = (type === 'facts' && meta?.mediaType) ? meta.mediaType : type;

                // --- Manual Page Break Check ---
                const rawParts = content.split('---');
                rawParts.forEach((part, idx) => {
                    if (idx > 0) pushPage(); // Force break on '---'

                    let remainingText = part.trim();
                    let currentPartIndex = 0; // Track split parts for independent layout correction

                    while (remainingText.length > 0) {
                        const index = (meta && typeof meta.fIdx === 'number')
                            ? meta.fIdx
                            : (meta && typeof meta.index === 'number') ? meta.index : 0;

                        // Use unique key for this specific part of the split
                        const sKey = getSectionKey(lesson.id, type, index, currentPartIndex);
                        const localCorrection = sectionLayouts[sKey] || 0;
                        const manualHeight = sectionHeights[sKey];

                        // Resolve Spacing for this type
                        // We use the global blockSpacing as the primary gap between blocks
                        // mt is only used for the very first block of a lesson/section
                        const isSubsequent = (index > 0 || currentPartIndex > 0);
                        const blockS = 16;
                        const specificMt = ((options.styles as any)[`${type}MarginTop`] ?? (options.styles as any)[`${type}MT`] ?? 4) * 4;

                        const isStartOfPage = currentHeight === 0;
                        const spacing = isStartOfPage ? 0 : (isSubsequent ? blockS : specificMt);

                        const estimatedH = measureContentHeight(remainingText, fs, lh, bold, measureType, options.layoutCorrection + localCorrection, currentPartIndex);
                        const remainingPageSpace = CONTENT_HEIGHT_PX - currentHeight;

                        // Consumption on page includes content + spacing + bottom margin (which we now also treat as blockS)
                        // Actually, to avoid double-counting blockS, we treat the gap as 'spacing' (gap BEFORE block)
                        // And we ensure the renderer's MB corresponds to this.

                        // PRE-CHECK: If even the minimum block doesn't fit, push page immediately
                        let minNeededHeight = spacing;
                        if (currentPartIndex === 0 && meta && meta.originalTitle) {
                            // Unified title height (approx 24px + 8px MB)
                            minNeededHeight += 32;
                        }
                        minNeededHeight += lh * fs * 1.33; // At least one line of text

                        const absoluteMaxHeight = (PAGE_HEIGHT_PX - MARGIN_Y_PX) - currentHeight - spacing; // Exact pixel limit

                        if (!isStartOfPage && minNeededHeight > remainingPageSpace && !manualHeight) {
                            pushPage();
                            continue; // Retry on fresh page
                        }

                        // Case 0: Manual Height Override (User Resizing)
                        if (manualHeight) {
                            // Calculate Title Height if present (only on first part)
                            let titleHeight = 0;
                            if (currentPartIndex === 0 && meta && meta.originalTitle) {
                                titleHeight = 24;
                            }

                            // Use manualHeight, clamped only by the ABSOLUTE limit, not the buffered limit.
                            const targetHeight = Math.min(manualHeight, absoluteMaxHeight);

                            // Available space for TEXT (Padding is handled inside splitTextForHeight -> measureContentHeight)
                            const maxBoxHeight = Math.max(10, targetHeight - titleHeight);

                            // Split text to fit exactly in targetHeight (using GREEDY mode to fill requested space)
                            const { fit, remainder } = splitTextForHeight(remainingText, maxBoxHeight, fs, lh, bold, true, options.layoutCorrection + localCorrection, measureType, currentPartIndex);

                            // For height tracking, we use the manual height as the consumption
                            currentHeight += targetHeight + spacing;

                            currentPageSections.push({
                                type,
                                content: fit,
                                fieldName,
                                ...meta,
                                partIndex: currentPartIndex,
                                manualHeight: targetHeight, // Store clamp height for renderer
                                maxPossibleHeight: absoluteMaxHeight // PASS TO RENDERER FOR CLAMPING
                            });

                            if (remainder.length > 0) {
                                pushPage();
                                remainingText = remainder;
                                currentPartIndex++;
                                continue;
                            } else {
                                remainingText = '';
                                currentPartIndex++;
                            }
                        }
                        // Case 1: Applies on current page
                        else if (estimatedH + spacing <= remainingPageSpace) {
                            currentHeight += (estimatedH + spacing);
                            currentPageSections.push({
                                type,
                                content: remainingText,
                                fieldName,
                                ...meta,
                                fIdx: meta.fIdx, // Ensure indices are passed for downstream use
                                qIdx: meta.qIdx,
                                partIndex: currentPartIndex,
                                maxPossibleHeight: absoluteMaxHeight
                            });
                            remainingText = '';
                            currentPartIndex++;
                        }
                        // Case 2: Defined structure (Image, Quiz) that shouldn't be split -> Push Page
                        else if (type === 'quiz' || type === 'image') {
                            pushPage();
                            // Add to new page
                            currentHeight += (estimatedH + SECTION_SPACING_PX); // Assuming it fits on a fresh page
                            currentPageSections.push({ type, content: remainingText, fieldName, ...meta, partIndex: currentPartIndex, maxPossibleHeight: absoluteMaxHeight });
                            remainingText = '';
                            currentPartIndex++;
                        }
                        // Case 3: Text that needs splitting
                        else {
                            // Calculate how much text fits in remaining space
                            const spaceForText = remainingPageSpace - spacing;

                            // If space is too small (< 40px), just push page to avoid orphans
                            if (spaceForText < 40) {
                                pushPage();
                                continue; // Loop again with fresh page
                            }

                            const { fit, remainder } = splitTextForHeight(remainingText, spaceForText, fs, lh, bold, false, options.layoutCorrection + localCorrection, measureType, currentPartIndex);

                            if (fit.length > 0) {
                                currentHeight += remainingPageSpace; // Determine page is full
                                currentPageSections.push({ type, content: fit, fieldName, ...meta, partIndex: currentPartIndex, maxPossibleHeight: absoluteMaxHeight });
                                pushPage();
                                remainingText = remainder;
                                currentPartIndex++;
                            } else {
                                // Should not happen if logic is correct, but safe fallback
                                pushPage();
                            }
                        }
                    }
                });
            };

            // 1. Title
            addBlock('title', lesson.title, 'title', undefined, options.styles);

            // 2. Intro
            if (options.showIntro) {
                addBlock('intro', lesson.content, 'content', undefined, options.styles);
            }

            // 3. Bible
            if (options.showBibleText && lesson.verses.length > 0) {
                const bibleContent = lesson.verses.map(v => `**${v.verse}** ${v.text}`).join('\n');
                addBlock('bible', bibleContent, 'verses', undefined, options.styles);
            }

            // 4. Facts (Unified Text-Grouping)
            if (options.showFacts) {
                let currentTextGroup: string[] = [];

                let firstIdxInGroup = -1;
                const flushTextGroup = () => {
                    if (currentTextGroup.length > 0) {
                        const combinedContent = currentTextGroup.join('\n\n');
                        addBlock('facts', combinedContent, 'facts', { fIdx: firstIdxInGroup, mediaType: 'text', isFact: true, isUnified: true }, options.styles);
                        currentTextGroup = [];
                        firstIdxInGroup = -1;
                    }
                };

                lesson.facts.forEach((f, fIdx) => {
                    const mediaType = f.type || 'text';
                    const isVisible =
                        (mediaType === 'text' && options.mediaFilters.text) ||
                        ((mediaType === 'image' || mediaType === 'bild') && options.mediaFilters.image) ||
                        ((mediaType === 'video' || mediaType === 'yt') && options.mediaFilters.video) ||
                        (mediaType === 'link' && options.mediaFilters.link) ||
                        (mediaType === 'map' && options.mediaFilters.map);

                    if (!isVisible) return;

                    if (mediaType === 'text') {
                        if (firstIdxInGroup === -1) firstIdxInGroup = fIdx;
                        // Group text facts
                        // Sanitization: Only add ### header if it's not already at the start of the description
                        const titlePart = f.title && !f.description.startsWith('###')
                            ? `### ${f.title.replace(/^###\s*/, '')}\n`
                            : '';
                        currentTextGroup.push(`${titlePart}${f.description}`);
                    } else {
                        // Non-text items flush the current group
                        flushTextGroup();

                        // Title of Fact
                        if (f.title) {
                            addBlock('facts', f.description, 'facts', { fIdx, mediaType, originalTitle: f.title, isFact: true }, options.styles);
                        } else {
                            addBlock('facts', f.description, 'facts', { fIdx, mediaType, isFact: true }, options.styles);
                        }
                    }
                });

                flushTextGroup();
            }

            // 5. Questions
            if (options.showQuestions) {
                lesson.questions.forEach((q, qIdx) => {
                    // Estimate Question Height
                    // Question text height + Answer Lines Height
                    const qText = q.question;
                    const fs = options.styles.questions || 11;
                    const lh = options.styles.questionsLH || 1.4;

                    // Answer area
                    const lineCount = options.answerLines || 3;
                    const lineSpacing = options.styles.answerLineSpacing || 1.5;
                    // NEW: Precise Calculation to match Renderer pixels
                    // Rendered: mt-4 (1rem=16px) + gap*(count-1) + count*1px
                    const gapPx = lineSpacing * 16;
                    const answerHeight = (options.lineForAnswers && lineCount > 0)
                        ? (16 + (lineCount - 1) * gapPx + lineCount + 5) // +5 buffer
                        : 0;

                    // We need a custom logic for Question + Answer block because we shouldn't split a question from its answer lines if possible
                    // But we might split the question text itself?
                    // Better to treat (Question + AnswerSpaces) as an atomic block if it fits

                    const sKey = getSectionKey(lesson.id, 'question', qIdx);
                    const localCorrection = sectionLayouts[sKey] || 0;

                    // Manual Page Break Check
                    if (sectionPageBreaks[sKey]) {
                        pushPage();
                    }

                    const qHeight = measureContentHeight(qText, fs, lh, false, 'questions', options.layoutCorrection + localCorrection);
                    const totalBlockHeight = qHeight + answerHeight + SECTION_SPACING_PX;

                    if (currentHeight + totalBlockHeight <= CONTENT_HEIGHT_PX) {
                        currentHeight += totalBlockHeight;
                        currentPageSections.push({ type: 'question', content: qText, fieldName: 'questions', qIdx, partIndex: 0 });
                    } else {
                        // Doesn't fit.
                        // Can we just start new page?
                        pushPage();
                        currentHeight += totalBlockHeight;
                        currentPageSections.push({ type: 'question', content: qText, fieldName: 'questions', qIdx, partIndex: 0 });
                    }
                });
            }

            // 6. Memory Verse
            if (options.showMemoryVerses && lesson.memoryVerses.length > 0) {
                lesson.memoryVerses.forEach((mv, mvIdx) => {
                    // Only add bold wrapper if there is actually a verse ref
                    const versePart = mv.verse ? `**${mv.verse}**\n\n` : '';
                    const mvContent = `${versePart}${mv.text || ''}`;
                    addBlock('memory', mvContent, 'memoryVerses', { index: mvIdx }, options.styles);
                });
            }

            // 7. Notes
            if (options.showNotes) {
                const notesHeader = options.styles.notesHeader || 'Persönliche Notizen';
                let remainingLines = options.styles.notesLines || 5;
                const notesLineSpacing = options.styles.notesLineSpacing || 1.5;

                const lineGapPx = notesLineSpacing * 16;
                const singleLineHeight = lineGapPx + 1; // +1 for border

                // Header Height Estimation - Must use sectionTitle styles
                const headerHeight = measureContentHeight(notesHeader, options.styles.sectionTitle, options.styles.sectionTitleLH, options.styles.sectionTitleBold, 'sectionTitle');

                let partIndex = 0;

                // Loop until all lines are placed
                while (remainingLines > 0) {
                    // Header on EVERY part (User requirement)
                    const currentHeaderH = headerHeight;

                    const mt = options.styles.notesMarginTop ?? 16;
                    let availableHeight = CONTENT_HEIGHT_PX - currentHeight - mt;

                    // Check if we need to wrap to new page immediately
                    // Case: Not enough space for Header + 1st Line + Padding (16px pt-4)
                    const minNeeded = currentHeaderH + singleLineHeight + 16;

                    if (availableHeight < minNeeded) {
                        pushPage();
                        availableHeight = CONTENT_HEIGHT_PX - mt;
                    }

                    // Calculate how many lines fit
                    // available = header + gap (16) + lines * lineH
                    const spaceForLines = availableHeight - currentHeaderH - 16;
                    let linesThisPage = Math.floor(spaceForLines / singleLineHeight);

                    // Clamp to remaining
                    if (linesThisPage > remainingLines) linesThisPage = remainingLines;
                    if (linesThisPage < 0) linesThisPage = 0;

                    // Add section
                    currentPageSections.push({
                        type: 'notes',
                        content: notesHeader,
                        fieldName: 'notes',
                        notesLines: linesThisPage,
                        notesLineSpacing,
                        partIndex: partIndex
                    });

                    // Update tracking
                    const blockHeight = currentHeaderH + 16 + (linesThisPage * singleLineHeight);
                    currentHeight += blockHeight + mt;
                    remainingLines -= linesThisPage;
                    partIndex++;

                    // If more lines remain, we need a new page
                    if (remainingLines > 0) {
                        pushPage();
                    }
                }

                // 7b. Additional Full Pages
                const additionalPages = options.styles.notesAdditionalPages || 0;
                for (let i = 0; i < additionalPages; i++) {
                    pushPage();
                    const mtExtra = (options.styles.notesMarginTopExtra ?? 4) * 4; // 4px per unit
                    let availableHeight = CONTENT_HEIGHT_PX - mtExtra;

                    const currentHeaderH = headerHeight;
                    const spaceForLines = availableHeight - currentHeaderH - 16;

                    // Use notesLinesExtra if > 0, otherwise fill page
                    const maxLinesOnPage = Math.floor(spaceForLines / singleLineHeight);
                    let linesThisPage = (options.styles.notesLinesExtra > 0)
                        ? Math.min(options.styles.notesLinesExtra, maxLinesOnPage)
                        : maxLinesOnPage;

                    currentPageSections.push({
                        type: 'notes',
                        content: notesHeader,
                        fieldName: 'notes',
                        notesLines: linesThisPage,
                        notesLineSpacing,
                        partIndex: partIndex + i + 1
                    });

                    // Set height to max to ensure this page is treated as full
                    currentHeight = CONTENT_HEIGHT_PX;
                }
            }

            pushPage();
        });

        return pages;
    };

    const workbookPages = getWorkbookPages();

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchWorkbookData(ids);
            // Sort by the order of IDs in the URL to preserve user selection order
            const sortedData = ids.map(id => data.find(l => l.id === id)).filter(Boolean) as WorkbookLesson[];
            setLessons(sortedData);
        } catch (e) {
            console.error("Failed to load workbook data:", e);
        } finally {
            setLoading(false);
        }
    };

    const moveLesson = (index: number, direction: 'up' | 'down') => {
        const newLessons = [...lessons];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newLessons.length) return;

        [newLessons[index], newLessons[targetIndex]] = [newLessons[targetIndex], newLessons[index]];
        setLessons(newLessons);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-slate-900">
                <RefreshCw className="animate-spin text-indigo-500 mb-4" size={32} />
                <p className="text-zinc-500 font-medium">Lade Arbeitsheft-Inhalte...</p>
            </div>
        );
    }

    if (ids.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <h1 className="text-xl font-bold mb-4">Keine Lektionen ausgewählt</h1>
                <Link href="/setup" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Zurück zur Übersicht</Link>
            </div>
        );
    }

    return (
        <div className={clsx(
            "min-h-screen flex flex-col transition-colors duration-500 print:block print:h-auto",
            isFullscreen ? "bg-zinc-200 dark:bg-slate-900" : "bg-zinc-100 dark:bg-slate-950"
        )}>
            {/* Top Bar */}
            <header className={clsx(
                "no-print bg-white dark:bg-slate-900 border-b border-zinc-200 dark:border-slate-800 items-center justify-between px-4 sticky top-0 z-50 transition-all duration-300",
                isFullscreen ? "pointer-events-none opacity-0 h-0 p-0 overflow-hidden" : "flex h-14"
            )}>
                <div className="flex items-center gap-4">
                    <Link href="/setup" className="p-2 hover:bg-zinc-100 dark:hover:bg-slate-800 rounded-full transition-colors text-zinc-500">
                        <ChevronLeft size={20} />
                    </Link>
                    <h1 className="font-bold text-lg hidden sm:block">Arbeitsheft Creator</h1>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setZoomMode(zoomMode === 'fit-page' ? 'fit-width' : 'fit-page')}
                        className={clsx(
                            "p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-slate-800",
                            zoomMode === 'fit-width' && "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30"
                        )}
                        title={zoomMode === 'fit-page' ? "An Breite anpassen" : "Ganze Seite anzeigen"}
                    >
                        <RefreshCw size={18} className={clsx(zoomMode === 'fit-width' && "rotate-90")} />
                        <span className="hidden md:block">{zoomMode === 'fit-page' ? "Breite" : "Ganzes Blatt"}</span>
                    </button>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={clsx(
                            "p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium",
                            showSettings ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-slate-800"
                        )}
                    >
                        <SettingsIcon size={18} />
                        <span className="hidden md:block">Optionen</span>
                    </button>
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className={clsx(
                            "p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium",
                            isFullscreen ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-slate-800"
                        )}
                        title={isFullscreen ? "Vorschau verkleinern" : "Vollbild-Vorschau"}
                    >
                        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        <span className="hidden md:block">{isFullscreen ? "Standard" : "Vollbild"}</span>
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg transition-colors ml-2"
                        title="Als PDF herunterladen oder drucken"
                    >
                        <Printer size={18} />
                        <span className="hidden sm:inline">PDF</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden print:overflow-visible print:h-auto print:block relative">
                {/* Scroll Container with padding for floating toolboxes */}
                {/* Floating Exit Fullscreen Button */}
                {isFullscreen && (
                    <button
                        onClick={() => setIsFullscreen(false)}
                        className="no-print fixed top-6 right-6 z-[60] p-4 bg-white dark:bg-slate-800 text-indigo-600 rounded-full shadow-2xl border border-indigo-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all"
                        title="Vollbild beenden"
                    >
                        <Minimize2 size={24} />
                    </button>
                )}

                {/* Settings Drawer Overlay - Removed to allow scrolling while editing */}
                {/* {showSettings && (
                    <div
                        className="fixed inset-0 bg-black/20 z-[70] no-print transition-opacity"
                        onClick={() => setShowSettings(false)}
                    />
                )} */}

                {/* Settings Drawer */}
                <aside className={clsx(
                    "no-print fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-900 border-l border-zinc-200 dark:border-slate-800 shadow-2xl z-[80] transition-transform duration-300 transform overflow-y-auto p-6 space-y-8",
                    showSettings ? "translate-x-0" : "translate-x-full"
                )}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold text-lg">Optionen</h2>
                        <button
                            onClick={() => setShowSettings(false)}
                            className="p-2 hover:bg-zinc-100 dark:hover:bg-slate-800 rounded-lg text-zinc-400 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800/50 mb-4">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-indigo-900 dark:text-indigo-200">Als Standard speichern</span>
                                <span className="text-[10px] text-indigo-600 dark:text-indigo-400">Änderungen werden dauerhaft gespeichert</span>
                            </div>
                            <div
                                onClick={() => {
                                    const nextState = !saveAsDefault;
                                    setSaveAsDefault(nextState);
                                    localStorage.setItem('workbook_creator_default_toggle', String(nextState));
                                }}
                                className={clsx(
                                    "w-10 h-5 rounded-full relative transition-colors cursor-pointer",
                                    saveAsDefault ? "bg-indigo-600" : "bg-zinc-200 dark:bg-slate-700"
                                )}
                            >
                                <div className={clsx(
                                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-transform",
                                    saveAsDefault ? "left-6" : "left-1"
                                )} />
                            </div>
                        </div>


                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Sichtbarkeit & Formatierung</h3>
                        {[
                            { id: 'title', label: 'Titel', toggleKey: null },
                            { id: 'sectionheaders', label: 'Überschriften (Global)', toggleKey: null }, // Global Headers
                            { id: 'einführung', label: 'Einleitung', toggleKey: 'showIntro' },
                            { id: 'bibeltext', label: 'Bibeltext', toggleKey: 'showBibleText' },
                            { id: 'infos', label: 'Infos & Medien', toggleKey: 'showFacts', isAccordion: true },
                            { id: 'fragen', label: 'Fragen', toggleKey: 'showQuestions' },
                            { id: 'lernvers', label: 'Lernvers', toggleKey: 'showMemoryVerses' },
                            { id: 'notizen', label: 'Notizen', toggleKey: 'showNotes' }, // Added Notes toggle
                        ].map((section) => {
                            const fmtKey = section.id === 'sectionheaders' ? 'sectionTitle' : (section.id === 'einführung' ? 'intro' : (section.id === 'bibeltext' ? 'bible' : (section.id === 'infos' ? 'facts' : (section.id === 'fragen' ? 'questions' : (section.id === 'lernvers' ? 'memory' : (section.id === 'notizen' ? 'notes' : 'title'))))));
                            const isOpen = openSections[`fmt_${fmtKey}`];

                            return (
                                <div key={section.id} className="space-y-2">
                                    <div className="flex flex-col bg-zinc-50 dark:bg-slate-800/50 rounded-xl transition-all overflow-hidden border border-zinc-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between p-3">
                                            <div className="flex items-center gap-3 flex-1">
                                                <button
                                                    onClick={() => setOpenSections(prev => ({ ...prev, [`fmt_${fmtKey}`]: !prev[`fmt_${fmtKey}`] }))}
                                                    className={clsx(
                                                        "p-1 hover:bg-zinc-200 dark:hover:bg-slate-700 rounded-md transition-transform",
                                                        isOpen ? "rotate-90 text-indigo-600" : "rotate-0 text-zinc-400"
                                                    )}
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                                <span className="text-sm font-semibold cursor-pointer" onClick={() => setOpenSections(prev => ({ ...prev, [`fmt_${fmtKey}`]: !prev[`fmt_${fmtKey}`] }))}>
                                                    {section.label}
                                                </span>
                                            </div>
                                            {section.toggleKey && (
                                                <div
                                                    onClick={() => {
                                                        setOptions((prev: any) => {
                                                            const newValue = !prev[section.toggleKey!];
                                                            const next = { ...prev, [section.toggleKey!]: newValue };
                                                            if (section.id === 'infos') {
                                                                next.mediaFilters = {
                                                                    text: newValue,
                                                                    image: newValue,
                                                                    video: newValue,
                                                                    link: newValue,
                                                                    map: newValue
                                                                };
                                                            }

                                                            // Persistence
                                                            if (saveAsDefault) {
                                                                try {
                                                                    const currentOptions = JSON.parse(localStorage.getItem('workbook_creator_options') || '{}');
                                                                    currentOptions[section.toggleKey!] = newValue;
                                                                    if (section.id === 'infos') {
                                                                        currentOptions.mediaFilters = next.mediaFilters;
                                                                    }
                                                                    localStorage.setItem('workbook_creator_options', JSON.stringify(currentOptions));
                                                                } catch (e) {
                                                                    console.error("Failed to save default options", e);
                                                                }
                                                            }

                                                            return next;
                                                        });
                                                    }}
                                                    className={clsx(
                                                        "w-10 h-5 rounded-full relative transition-colors cursor-pointer",
                                                        options[section.toggleKey as keyof typeof options] ? "bg-indigo-600" : "bg-zinc-200 dark:bg-slate-700"
                                                    )}
                                                >
                                                    <div className={clsx(
                                                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-transform",
                                                        options[section.toggleKey as keyof typeof options] ? "left-6" : "left-1"
                                                    )} />
                                                </div>
                                            )}

                                        </div>

                                        {/* Formatting Body */}
                                        {isOpen && (
                                            <div className="px-3 pb-3 pt-0 border-t border-zinc-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50">
                                                {/* Special handling for Infos & Media Sub-toggles */}
                                                {section.id !== 'infos' && section.id !== 'notizen' && (
                                                    <div className="space-y-4">
                                                        {section.id === 'fragen' && (
                                                            <div>
                                                                <label className="text-[10px] font-medium text-zinc-500 block mb-1">Überschrift</label>
                                                                <input
                                                                    type="text"
                                                                    value={options.styles.questionsHeader}
                                                                    onChange={(e) => handleStyleChange('Header', e.target.value, 'questions')}
                                                                    className="w-full text-xs p-2 rounded-lg bg-zinc-100 dark:bg-slate-800 border-none focus:ring-1 focus:ring-indigo-500"
                                                                    placeholder="z.B. Fragen"
                                                                />
                                                            </div>
                                                        )}
                                                        {renderStyleControls(fmtKey, true)}
                                                    </div>
                                                )}

                                                {/* Extended Sub-Styling for Infos - Merged into List */}
                                                {section.id === 'infos' && (
                                                    <>
                                                        <div className="py-2 mb-2 space-y-4 border-b border-zinc-100 dark:border-slate-800 text-left">
                                                            <div>
                                                                <label className="text-[10px] font-medium text-zinc-500 block mb-1">Überschrift</label>
                                                                <input
                                                                    type="text"
                                                                    value={options.styles.factsHeader}
                                                                    onChange={(e) => handleStyleChange('Header', e.target.value, 'facts')}
                                                                    className="w-full text-xs p-2 rounded-lg bg-zinc-100 dark:bg-slate-800 border-none focus:ring-1 focus:ring-indigo-500"
                                                                    placeholder="z.B. Infos"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="py-2 mb-2 space-y-2 border-b border-zinc-100 dark:border-slate-800">
                                                            <h6 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Datentypen & Formatierung</h6>
                                                            {[
                                                                { id: 'text', label: 'Texte', icon: Type, fmtKey: 'factsText' },
                                                                { id: 'image', label: 'Bilder', icon: ImageIcon, fmtKey: 'factsImage' },
                                                                { id: 'video', label: 'Videos', icon: Youtube, fmtKey: 'factsVideo' },
                                                                { id: 'link', label: 'Links', icon: Link2, fmtKey: 'factsLink' },
                                                                { id: 'map', label: 'Karten', icon: MapPin, fmtKey: 'factsMap' },
                                                            ].map((media) => {
                                                                const openKey = `fmt_${media.fmtKey}`;
                                                                const isOpen = openSections[openKey];

                                                                return (
                                                                    <div key={media.id} className="rounded-lg border border-zinc-200 dark:border-slate-700 bg-zinc-50 dark:bg-slate-800/50 overflow-hidden transition-all">
                                                                        <div className="flex items-center justify-between p-2">
                                                                            <div className="flex items-center gap-2 flex-1">
                                                                                <button
                                                                                    onClick={() => setOpenSections(prev => ({ ...prev, [openKey]: !prev[openKey] }))}
                                                                                    className={clsx(
                                                                                        "p-1 hover:bg-zinc-200 dark:hover:bg-slate-700 rounded-md transition-transform",
                                                                                        isOpen ? "rotate-90 text-indigo-600" : "rotate-0 text-zinc-400"
                                                                                    )}
                                                                                >
                                                                                    <ChevronRight size={14} />
                                                                                </button>
                                                                                <media.icon size={14} className="text-zinc-500 dark:text-zinc-400" />
                                                                                <span
                                                                                    className="text-xs font-bold uppercase text-zinc-600 dark:text-zinc-300 cursor-pointer select-none"
                                                                                    onClick={() => setOpenSections(prev => ({ ...prev, [openKey]: !prev[openKey] }))}
                                                                                >
                                                                                    {media.label}
                                                                                </span>
                                                                            </div>

                                                                            {/* Visibility Toggle */}
                                                                            <div
                                                                                onClick={() => setOptions((prev: any) => ({
                                                                                    ...prev,
                                                                                    mediaFilters: {
                                                                                        ...prev.mediaFilters,
                                                                                        [media.id]: !prev.mediaFilters[media.id as keyof typeof prev.mediaFilters]
                                                                                    }
                                                                                }))}
                                                                                className={clsx(
                                                                                    "w-8 h-4 rounded-full relative transition-colors cursor-pointer",
                                                                                    options.mediaFilters[media.id as keyof typeof options.mediaFilters] ? "bg-indigo-600" : "bg-zinc-200 dark:bg-slate-700"
                                                                                )}
                                                                            >
                                                                                <div className={clsx(
                                                                                    "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform",
                                                                                    options.mediaFilters[media.id as keyof typeof options.mediaFilters] ? "left-4.5" : "left-0.5"
                                                                                )} />
                                                                            </div>
                                                                        </div>

                                                                        {/* Expanded Formatting Controls */}
                                                                        {isOpen && (
                                                                            <div className="py-2 mb-2 space-y-3 border-b border-zinc-100 dark:border-slate-800 text-left">
                                                                                {renderStyleControls(media.fmtKey, true)}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                            <div className="h-2"></div>
                                                        </div>
                                                    </>
                                                )}

                                                {/* Notes Specific Controls */}
                                                {section.id === 'notizen' && options.showNotes && (
                                                    <div className="space-y-4 pt-2">
                                                        {/* Header Text Input */}
                                                        <div>
                                                            <label className="text-[10px] font-medium text-zinc-500 block mb-1">Überschrift</label>
                                                            <input
                                                                type="text"
                                                                value={options.styles.notesHeader}
                                                                onChange={(e) => handleStyleChange('Header', e.target.value, 'notes')}
                                                                placeholder="Überschrift (z.B. Persönliche Notizen)"
                                                                className="w-full text-xs p-2 rounded bg-zinc-100 dark:bg-slate-800 border-none focus:ring-1 focus:ring-indigo-500"
                                                            />
                                                        </div>

                                                        {/* Line Count */}
                                                        <div className="flex justify-between items-center gap-2">
                                                            <span className="text-[10px] font-medium text-zinc-500 flex items-center gap-1"><AlignJustify size={10} /> Anzahl Linien</span>
                                                            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-slate-800 rounded px-1">
                                                                <button onClick={() => handleStyleChange('Lines', Math.max(1, (options.styles.notesLines || 5) - 1), 'notes')} className="p-1 hover:bg-zinc-200 rounded" title="Verringern"><Minus size={10} /></button>
                                                                <span className="text-[10px] font-bold w-4 text-center">{options.styles.notesLines || 5}</span>
                                                                <button onClick={() => handleStyleChange('Lines', Math.min(100, (options.styles.notesLines || 5) + 1), 'notes')} className="p-1 hover:bg-zinc-200 rounded" title="Erhöhen"><Plus size={10} /></button>
                                                            </div>
                                                        </div>
                                                        {/* Line Spacing */}
                                                        <div className="flex justify-between items-center gap-2">
                                                            <span className="text-[10px] font-medium text-zinc-500 flex items-center gap-1"><ChevronsLeftRight size={10} className="rotate-90" /> Linienabstand</span>
                                                            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-slate-800 rounded px-1">
                                                                <button onClick={() => handleStyleChange('LineSpacing', Math.max(0.5, (options.styles.notesLineSpacing || 1.5) - 0.1), 'notes')} className="p-1 hover:bg-zinc-200 rounded" title="Verringern"><Minus size={10} /></button>
                                                                <span className="text-[10px] font-bold w-6 text-center">{(options.styles.notesLineSpacing || 1.5).toFixed(1)}</span>
                                                                <button onClick={() => handleStyleChange('LineSpacing', Math.min(4, (options.styles.notesLineSpacing || 1.5) + 0.1), 'notes')} className="p-1 hover:bg-zinc-200 rounded" title="Erhöhen"><Plus size={10} /></button>
                                                            </div>
                                                        </div>

                                                        {/* Additional Pages */}
                                                        <div className="flex justify-between items-center gap-2">
                                                            <span className="text-[10px] font-medium text-zinc-500 flex items-center gap-1"><Copy size={10} /> Zusätzliche volle Seiten</span>
                                                            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-slate-800 rounded px-1">
                                                                <button onClick={() => handleStyleChange('AdditionalPages', Math.max(0, (options.styles.notesAdditionalPages || 0) - 1), 'notes')} className="p-1 hover:bg-zinc-200 rounded" title="Verringern"><Minus size={10} /></button>
                                                                <span className="text-[10px] font-bold w-4 text-center">{options.styles.notesAdditionalPages || 0}</span>
                                                                <button onClick={() => handleStyleChange('AdditionalPages', Math.min(10, (options.styles.notesAdditionalPages || 0) + 1), 'notes')} className="p-1 hover:bg-zinc-200 rounded" title="Erhöhen"><Plus size={10} /></button>
                                                            </div>
                                                        </div>

                                                        {/* Extra Pages Controls */}
                                                        {options.styles.notesAdditionalPages > 0 && (
                                                            <div className="space-y-3 pl-4 border-l-2 border-indigo-100 dark:border-slate-800 ml-1">
                                                                <div className="flex justify-between items-center gap-2">
                                                                    <span className="text-[10px] font-medium text-zinc-500 flex items-center gap-1"><AlignJustify size={10} /> Linien (Folgeseiten)</span>
                                                                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-slate-800 rounded px-1">
                                                                        <button onClick={() => handleStyleChange('LinesExtra', Math.max(0, (options.styles.notesLinesExtra || 0) - 1), 'notes')} className="p-1 hover:bg-zinc-200 rounded" title="Verringern"><Minus size={10} /></button>
                                                                        <span className="text-[10px] font-bold min-w-4 text-center">
                                                                            {options.styles.notesLinesExtra === 0
                                                                                ? (() => {
                                                                                    // Quick estimate for display
                                                                                    const mtExtra = (options.styles.notesMarginTopExtra ?? 4) * 4;
                                                                                    const avail = CONTENT_HEIGHT_PX - mtExtra;
                                                                                    const lineGapPx = (options.styles.notesLineSpacing || 1.5) * 16;
                                                                                    const singleH = lineGapPx + 1;
                                                                                    const headerH = 24; // Approx sectionTitle height
                                                                                    return Math.floor((avail - headerH - 16) / singleH);
                                                                                })()
                                                                                : options.styles.notesLinesExtra
                                                                            }
                                                                        </span>
                                                                        <button onClick={() => handleStyleChange('LinesExtra', Math.min(100, (options.styles.notesLinesExtra || 0) + 1), 'notes')} className="p-1 hover:bg-zinc-200 rounded" title="Erhöhen"><Plus size={10} /></button>
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-between items-center gap-2">
                                                                    <span className="text-[10px] font-medium text-zinc-500 flex items-center gap-1"><ChevronsLeftRight size={10} /> Abstand Oben (F.)</span>
                                                                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-slate-800 rounded px-1">
                                                                        <button onClick={() => handleStyleChange('MarginTopExtra', Math.max(0, (options.styles.notesMarginTopExtra || 0) - 4), 'notes')} className="p-1 hover:bg-zinc-200 rounded" title="Verringern"><Minus size={10} /></button>
                                                                        <span className="text-[10px] font-bold w-6 text-center">{options.styles.notesMarginTopExtra || 0}</span>
                                                                        <button onClick={() => handleStyleChange('MarginTopExtra', Math.min(400, (options.styles.notesMarginTopExtra || 0) + 4), 'notes')} className="p-1 hover:bg-zinc-200 rounded" title="Erhöhen"><Plus size={10} /></button>
                                                                    </div>
                                                                </div>
                                                                <p className="text-[9px] text-zinc-400 italic">0 = Seite komplett füllen</p>
                                                            </div>
                                                        )}

                                                        {renderStyleControls('notes', true)}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>


                    <div className="pt-6 border-t border-zinc-100 dark:border-slate-800">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1 mb-4">Anzeige & PDF</h3>
                        <div className="flex flex-col gap-4">

                            {/* Experimental Split Strategy Controls */}
                            <div className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 rounded-xl p-3 shadow-lg">
                                <h4 className="text-[10px] uppercase font-bold text-zinc-400 mb-2">Texttrennung (Experimentell)</h4>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => setSplitStrategy('paragraph')}
                                        className={clsx("p-2 text-xs font-medium rounded-lg text-left transition-all", splitStrategy === 'paragraph' ? "bg-indigo-600 text-white" : "hover:bg-indigo-50 dark:text-zinc-300 dark:hover:bg-slate-800")}
                                    >
                                        Nach Absätzen
                                    </button>
                                    <button
                                        onClick={() => setSplitStrategy('sentence')}
                                        className={clsx("p-2 text-xs font-medium rounded-lg text-left transition-all", splitStrategy === 'sentence' ? "bg-indigo-600 text-white" : "hover:bg-indigo-50 dark:text-zinc-300 dark:hover:bg-slate-800")}
                                    >
                                        Nach Satzende
                                    </button>
                                    <button
                                        onClick={() => setSplitStrategy('hyphens')}
                                        className={clsx("p-2 text-xs font-medium rounded-lg text-left transition-all", splitStrategy === 'hyphens' ? "bg-indigo-600 text-white" : "hover:bg-indigo-50 dark:text-zinc-300 dark:hover:bg-slate-800")}
                                    >
                                        Nach Silbentrennung
                                    </button>
                                    <button
                                        onClick={() => setSplitStrategy('smart')}
                                        className={clsx("p-2 text-xs font-medium rounded-lg text-left transition-all", splitStrategy === 'smart' ? "bg-indigo-600 text-white" : "hover:bg-indigo-50 dark:text-zinc-300 dark:hover:bg-slate-800")}
                                    >
                                        Smart (Standard)
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-slate-800/50 rounded-xl">
                                <span className="text-sm font-semibold">Seitenbreite füllen</span>
                                <div
                                    onClick={() => setZoomMode(zoomMode === 'fit-width' ? 'fit-page' : 'fit-width')}
                                    className={clsx(
                                        "w-10 h-5 rounded-full relative transition-colors cursor-pointer",
                                        zoomMode === 'fit-width' ? "bg-indigo-600" : "bg-zinc-200 dark:bg-slate-700"
                                    )}
                                >
                                    <div className={clsx(
                                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-transform",
                                        zoomMode === 'fit-width' ? "left-6" : "left-1"
                                    )} />
                                </div>
                            </div>

                            <button
                                onClick={handlePrint}
                                className="w-full flex items-center justify-center gap-3 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-xl shadow-indigo-200 dark:shadow-none"
                            >
                                <Printer size={20} />
                                <span>Als PDF speichern</span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Preview Area */}
                <main className={clsx(
                    "flex-1 flex flex-col items-center scroll-smooth transition-all overflow-y-auto print:overflow-visible print:h-auto no-scrollbar pb-96 print:pb-0 print:p-0",
                    isFullscreen ? "p-0 bg-zinc-200 dark:bg-slate-900" : "p-4 md:p-8 lg:px-20 xl:px-40 bg-zinc-100 dark:bg-slate-950"
                )}>
                    {/* Spacer for top margin */}
                    <div className={clsx("no-print", isFullscreen ? "h-10 min-h-[40px]" : "h-4")} />

                    {/* Scale Container to prevent horizontal scrollbars */}
                    <div
                        className="transition-all duration-500 relative z-10"
                        style={{
                            width: (isFullscreen || zoomMode === 'fit-width') ? (559.37 * scaleFactor) : 'min(100%, 559.37px)',
                            height: 'auto'
                        }}
                    >
                        <div
                            className={clsx(
                                "space-y-4 print:space-y-0 pb-32 print:pb-0 transition-transform duration-500",
                                (isFullscreen || zoomMode === 'fit-width') ? "w-[559.37px] absolute top-0 left-0" : "w-full max-w-[559.37px]"
                            )}
                            style={{
                                transform: (isFullscreen || zoomMode === 'fit-width') ? `scale(${scaleFactor})` : 'none',
                                transformOrigin: 'top left'
                            }}
                        >
                            {workbookPages.map((page, pageIdx) => (
                                <div key={`${page.lesson.id}-${page.pageNum}`} className="workbook-a5-page shadow-2xl print:shadow-none border border-zinc-200 dark:border-slate-800 !overflow-visible">
                                    <div
                                        className="workbook-content"
                                        style={{ fontSize: `${options.fontSize}pt` }}
                                    >
                                        {page.sections.map((section, sIdx) => {
                                            // Generate Stable Key
                                            const sectionMetaIndex = (section.fIdx !== undefined) ? section.fIdx : (section.qIdx !== undefined ? section.qIdx : (section.index !== undefined ? section.index : 0));
                                            const sectionPartIndex = section.partIndex || 0;
                                            // Force re-render when global spacing changes by including it in the key or ensuring styles are used
                                            const stableKey = `${section.type}-${sectionMetaIndex}-${sectionPartIndex}-${options.styles.blockSpacing}`;
                                            const borderClass = (p: string) => (options.styles as any)[`${p}Border`] ? `border-2 border-${(options.styles as any)[`${p}BorderColor`]}` : ((p === 'intro' && !options.styles.introBorder) ? 'border-l-2 border-indigo-100' : 'border-transparent');
                                            const shadowClass = (p: string) => (options.styles as any)[`${p}Shadow`] !== 'none' ? `shadow-${(options.styles as any)[`${p}Shadow`]}` : '';
                                            const radiusClass = (p: string) => {
                                                const r = (options.styles as any)[`${p}Radius`];
                                                if (r === 'none') return '';
                                                if (r === 'lg') return 'rounded-2xl';
                                                if (r === 'xl') return 'rounded-3xl';
                                                return `rounded-${r}`;
                                            };
                                            const fillClass = (p: string) => (options.styles as any)[`${p}Fill`] && (options.styles as any)[`${p}Fill`] !== 'none' ? (options.styles as any)[`${p}Fill`] : '';
                                            const commonClasses = (p: string) => `${borderClass(p)} ${shadowClass(p)} ${radiusClass(p)} ${fillClass(p)}`;
                                            const isSubsequent = sIdx > 0 && page.sections[sIdx - 1].type === section.type;
                                            const isFollowedBySame = sIdx < page.sections.length - 1 && page.sections[sIdx + 1].type === section.type;

                                            const getContainerStyle = (p: string, sub = false) => {
                                                const padUnits = ((options.styles as any)[`${p}Padding`] ?? 2);
                                                const mtUnits = (p === 'notes' && sectionPartIndex > 0) ? (options.styles.notesMarginTopExtra ?? 4) :
                                                    (sub ? 4 : ((options.styles as any)[`${p}MarginTop`] ?? 4));

                                                return {
                                                    width: `${(options.styles as any)[`${p}Width`] ?? 100}%`,
                                                    padding: `${padUnits * 0.25}rem`,
                                                    marginTop: `${mtUnits * 0.25}rem`,
                                                    marginBottom: 0,
                                                    marginLeft: 'auto',
                                                    marginRight: 'auto'
                                                };
                                            };

                                            if (section.type === 'title') return (
                                                <div key={stableKey} className={`relative group z-[50] hover:z-[100] !overflow-visible ${commonClasses('title')}`} style={getContainerStyle('title')}>
                                                    <SectionToolbar
                                                        onScale={(val) => handleStyleChange('fontSize', val, 'title')}
                                                        onLineHeight={(val) => handleStyleChange('lineHeight', val, 'title')}
                                                        fontSize={options.styles.title}
                                                        lineHeight={options.styles.titleLH}
                                                        isEditing={editingField?.lessonId === page.lesson.id && editingField?.field === 'title'}
                                                        isAnyEditing={!!editingField}
                                                        onSave={handleSaveEdit}
                                                        onCancel={handleCancelEdit}
                                                        bold={options.styles.titleBold}
                                                        italic={options.styles.titleItalic}
                                                        underline={options.styles.titleUnderline}
                                                        align={options.styles.titleAlign as 'left' | 'center' | 'right' | 'justify'}
                                                        hyphens={options.styles.titleHyphens}
                                                        onToggleStyle={(s) => handleStyleToggle(s, 'title')}
                                                        onChangeStyle={(s, v) => handleStyleChange(s, v, 'title')}
                                                        type="title"
                                                        layoutCorrection={sectionLayouts[getSectionKey(page.lesson.id, 'title', 0, section.partIndex)] || 0}
                                                        onLayoutCorrection={(val) => setSectionLayouts(prev => ({ ...prev, [getSectionKey(page.lesson.id, 'title', 0, section.partIndex)]: val }))}
                                                    />
                                                    <InlineEditor
                                                        value={editingField?.lessonId === page.lesson.id && editingField?.field === 'title' ? editingField.tempValue : section.content}
                                                        isActive={editingField?.lessonId === page.lesson.id && editingField?.field === 'title'}
                                                        isEditing={editingField?.field || null}
                                                        onEditToggle={(active) => setEditingField(active ? { lessonId: page.lesson.id, field: 'title', tempValue: section.content } : null)}
                                                        onChange={(val) => setEditingField(prev => prev ? { ...prev, tempValue: val } : null)}
                                                        className="font-bold leading-tight border-b-2 border-indigo-600 pb-2"
                                                        style={{
                                                            fontSize: `${options.styles.title}pt`,
                                                            lineHeight: options.styles.titleLH,
                                                            fontWeight: options.styles.titleBold ? 'bold' : 'normal',
                                                            fontStyle: options.styles.titleItalic ? 'italic' : 'normal',
                                                            textDecoration: options.styles.titleUnderline ? 'underline' : 'none',
                                                            textAlign: options.styles.titleAlign,
                                                            hyphens: options.styles.titleHyphens ? 'auto' : 'manual',
                                                            fontFamily: getFontFamily(options.styles.titleFont)
                                                        }}
                                                    />
                                                </div>
                                            );

                                            if (section.type === 'intro') return (
                                                <div key={stableKey} className={`relative group z-[20] hover:z-[100] !overflow-visible ${commonClasses('intro')}`} style={getContainerStyle('intro')}>
                                                    <SectionToolbar
                                                        onScale={(val) => handleStyleChange('fontSize', val, 'intro')}
                                                        onLineHeight={(val) => handleStyleChange('lineHeight', val, 'intro')}
                                                        fontSize={options.styles.intro}
                                                        lineHeight={options.styles.introLH}
                                                        isEditing={editingField?.lessonId === page.lesson.id && editingField?.field === 'content'}
                                                        isAnyEditing={!!editingField}
                                                        onSave={handleSaveEdit}
                                                        onCancel={handleCancelEdit}
                                                        bold={options.styles.introBold}
                                                        italic={options.styles.introItalic}
                                                        underline={options.styles.introUnderline}
                                                        align={options.styles.introAlign as 'left' | 'center' | 'right' | 'justify'}
                                                        hyphens={options.styles.introHyphens}
                                                        onToggleStyle={(s) => handleStyleToggle(s, 'intro')}
                                                        onChangeStyle={(s, v) => handleStyleChange(s, v, 'intro')}
                                                        type="intro"
                                                        layoutCorrection={sectionLayouts[getSectionKey(page.lesson.id, 'intro', 0, section.partIndex)] || 0}
                                                        onLayoutCorrection={(val) => setSectionLayouts(prev => ({ ...prev, [getSectionKey(page.lesson.id, 'intro', 0, section.partIndex)]: val }))}
                                                    />
                                                    <InlineEditor
                                                        value={editingField?.lessonId === page.lesson.id && editingField?.field === 'content' ? editingField.tempValue : section.content}
                                                        isActive={editingField?.lessonId === page.lesson.id && editingField?.field === 'content'}
                                                        isEditing={editingField?.field || null}
                                                        onEditToggle={(active) => setEditingField(active ? { lessonId: page.lesson.id, field: 'content', tempValue: section.content } : null)}
                                                        onChange={(val) => setEditingField(prev => prev ? { ...prev, tempValue: val } : null)}
                                                        markdown
                                                        multiline
                                                        className="text-zinc-700 italic"
                                                        style={{
                                                            fontSize: `${options.styles.intro}pt`,
                                                            lineHeight: options.styles.introLH,
                                                            fontWeight: options.styles.introBold ? 'bold' : 'normal',
                                                            fontStyle: options.styles.introItalic ? 'italic' : 'normal',
                                                            textDecoration: options.styles.introUnderline ? 'underline' : 'none',
                                                            textAlign: options.styles.introAlign,
                                                            hyphens: options.styles.introHyphens ? 'auto' : 'manual',
                                                            fontFamily: getFontFamily(options.styles.introFont)
                                                        }}
                                                    />
                                                </div>
                                            );

                                            if (section.type === 'bible') return (
                                                <div key={stableKey} className={`relative group z-[20] hover:z-[100] !overflow-visible ${commonClasses('bible')}`} style={getContainerStyle('bible')}>
                                                    <SectionToolbar
                                                        onScale={(val) => handleStyleChange('fontSize', val, 'bible')}
                                                        onLineHeight={(val) => handleStyleChange('lineHeight', val, 'bible')}
                                                        fontSize={options.styles.bible}
                                                        lineHeight={options.styles.bibleLH}
                                                        isEditing={editingField?.lessonId === page.lesson.id && editingField?.field === 'bible'}
                                                        isAnyEditing={!!editingField}
                                                        onSave={handleSaveEdit}
                                                        onCancel={handleCancelEdit}
                                                        bold={options.styles.bibleBold}
                                                        italic={options.styles.bibleItalic}
                                                        underline={options.styles.bibleUnderline}
                                                        align={options.styles.bibleAlign as 'left' | 'center' | 'right' | 'justify'}
                                                        hyphens={options.styles.bibleHyphens}
                                                        onToggleStyle={(s) => handleStyleToggle(s, 'bible')}
                                                        onChangeStyle={(s, v) => handleStyleChange(s, v, 'bible')}
                                                        type="bible"
                                                        layoutCorrection={sectionLayouts[getSectionKey(page.lesson.id, 'bible', 0, section.partIndex)] || 0}
                                                        onLayoutCorrection={(val) => setSectionLayouts(prev => ({ ...prev, [getSectionKey(page.lesson.id, 'bible', 0, section.partIndex)]: val }))}
                                                    />
                                                    <div className="flex items-center gap-2 uppercase tracking-wide" style={{
                                                        marginTop: `${options.styles.sectionTitleMT || 0}px`,
                                                        marginBottom: `${options.styles.sectionTitleMB || 8}px`,
                                                        fontSize: `${options.styles.sectionTitle}pt`,
                                                        lineHeight: options.styles.sectionTitleLH,
                                                        fontWeight: options.styles.sectionTitleBold ? '800' : 'normal',
                                                        fontStyle: options.styles.sectionTitleItalic ? 'italic' : 'normal',
                                                        textDecoration: options.styles.sectionTitleUnderline ? 'underline' : 'none',
                                                        textAlign: options.styles.sectionTitleAlign as any,
                                                        fontFamily: getFontFamily(options.styles.sectionTitleFont),
                                                        color: options.styles.sectionTitleColor || '#6366f1'
                                                    }}>
                                                        <BookOpen size={14} className="shrink-0" />
                                                        <span>Bibeltext</span>
                                                    </div>
                                                    <InlineEditor
                                                        value={editingField?.lessonId === page.lesson.id && editingField?.field === 'bible' ? editingField.tempValue : section.content}
                                                        isActive={editingField?.lessonId === page.lesson.id && editingField?.field === 'bible'}
                                                        isEditing={editingField?.field || null}
                                                        onEditToggle={(active) => setEditingField(active ? { lessonId: page.lesson.id, field: 'bible', tempValue: section.content } : null)}
                                                        onChange={(val) => setEditingField(prev => prev ? { ...prev, tempValue: val } : null)}
                                                        markdown
                                                        multiline
                                                        className="bible-text-p"
                                                        style={{
                                                            fontSize: `${options.styles.bible}pt`,
                                                            lineHeight: options.styles.bibleLH,
                                                            fontWeight: options.styles.bibleBold ? 'bold' : 'normal',
                                                            fontStyle: options.styles.bibleItalic ? 'italic' : 'normal',
                                                            textDecoration: options.styles.bibleUnderline ? 'underline' : 'none',
                                                            textAlign: options.styles.bibleAlign,
                                                            hyphens: options.styles.bibleHyphens ? 'auto' : 'manual',
                                                            fontFamily: getFontFamily(options.styles.bibleFont)
                                                        }}
                                                    />
                                                </div>
                                            );

                                            if (section.type === 'facts') {
                                                const factTypeMap: Record<string, string> = { text: 'factsText', image: 'factsImage', yt: 'factsVideo', video: 'factsVideo', link: 'factsLink', map: 'factsMap' };
                                                const fKey = factTypeMap[section.mediaType] || 'factsText';
                                                const getFs = (s: string) => (options.styles as any)[`${fKey}${s}`] ?? (options.styles as any)[`facts${s}`];

                                                return (
                                                    <div key={stableKey}
                                                        className={`fact-item relative group z-[20] hover:z-[100] !overflow-visible ${commonClasses(fKey)}`}
                                                        style={{
                                                            ...getContainerStyle(fKey, isSubsequent),
                                                            paddingBottom: section.manualHeight ? '24px' : (getContainerStyle(fKey, isSubsequent).padding),
                                                            height: section.manualHeight ? `${section.manualHeight}px` : undefined,
                                                            overflow: section.manualHeight ? 'hidden' : 'visible'
                                                        }}
                                                    >
                                                        <SectionToolbar
                                                            onScale={(val) => handleStyleChange('fontSize', val, 'facts')}
                                                            onLineHeight={(val) => handleStyleChange('lineHeight', val, 'facts')}
                                                            fontSize={options.styles.facts}
                                                            lineHeight={options.styles.factsLH}
                                                            isEditing={editingField?.lessonId === page.lesson.id && editingField?.field === 'facts' && editingField?.index === section.fIdx}
                                                            isAnyEditing={editingField !== null}
                                                            onSave={handleSaveEdit}
                                                            onCancel={handleCancelEdit}
                                                            bold={options.styles.factsBold}
                                                            italic={options.styles.factsItalic}
                                                            underline={options.styles.factsUnderline}
                                                            align={options.styles.factsAlign as 'left' | 'center' | 'right' | 'justify'}
                                                            hyphens={options.styles.factsHyphens}
                                                            onToggleStyle={(s) => handleStyleToggle(s, 'facts')}
                                                            onChangeStyle={(s, v) => handleStyleChange(s, v, 'facts')}
                                                            type="facts"
                                                            layoutCorrection={sectionLayouts[getSectionKey(page.lesson.id, 'facts', section.fIdx, section.partIndex)] || 0}
                                                            onLayoutCorrection={(val) => setSectionLayouts(prev => ({ ...prev, [getSectionKey(page.lesson.id, 'facts', section.fIdx, section.partIndex)]: val }))}
                                                            hasPageBreak={sectionPageBreaks[getSectionKey(page.lesson.id, 'facts', section.fIdx, 0)]} // Always check start of block
                                                            onTogglePageBreak={() => togglePageBreak(getSectionKey(page.lesson.id, 'facts', section.fIdx, 0))}
                                                        />
                                                        {/* Section Header for Facts - Only above first fact */}
                                                        {(options.styles.factsHeader && section.fIdx === 0 && section.partIndex === 0) && (
                                                            <InlineEditor
                                                                value={editingField?.lessonId === page.lesson.id && editingField?.field === 'factsHeader' && editingField?.index === section.fIdx ? editingField.tempValue : (options.styles.factsHeader || 'Infos & Medien')}
                                                                isActive={editingField?.lessonId === page.lesson.id && editingField?.field === 'factsHeader' && editingField?.index === section.fIdx}
                                                                isEditing={editingField?.field || null}
                                                                onChange={(val) => setEditingField(prev => prev ? { ...prev, tempValue: val } : null)}
                                                                onEditToggle={(isEditing) => {
                                                                    if (isEditing) {
                                                                        setEditingField({ lessonId: page.lesson.id, field: 'factsHeader', index: section.fIdx, tempValue: options.styles.factsHeader || 'Infos & Medien' });
                                                                    } else {
                                                                        if (editingField?.tempValue !== undefined) {
                                                                            handleStyleChange('Header', editingField.tempValue, 'facts');
                                                                        }
                                                                        handleCancelEdit();
                                                                    }
                                                                }}
                                                                className="uppercase tracking-wide flex items-center gap-2"
                                                                style={{
                                                                    marginTop: `${options.styles.sectionTitleMT || 0}px`,
                                                                    marginBottom: `${options.styles.sectionTitleMB || 8}px`,
                                                                    fontSize: `${options.styles.sectionTitle}pt`,
                                                                    lineHeight: options.styles.sectionTitleLH,
                                                                    fontFamily: getFontFamily(options.styles.sectionTitleFont),
                                                                    fontWeight: options.styles.sectionTitleBold ? '800' : 'normal',
                                                                    fontStyle: options.styles.sectionTitleItalic ? 'italic' : 'normal',
                                                                    textDecoration: options.styles.sectionTitleUnderline ? 'underline' : 'none',
                                                                    textAlign: options.styles.sectionTitleAlign as any,
                                                                    color: options.styles.sectionTitleColor || '#6366f1'
                                                                }}
                                                            >
                                                                <Info size={14} className="shrink-0" />
                                                                <span>{options.styles.factsHeader || 'Infos & Medien'}</span>
                                                            </InlineEditor>
                                                        )}
                                                        {section.isFact && section.originalTitle && section.partIndex === 0 && !section.isUnified && (
                                                            <div className="uppercase tracking-wide font-bold" style={{
                                                                // If it's a subsequent fact item, we set header margin to 0 to respect the absolute blockSpacing
                                                                marginTop: isSubsequent ? 0 : `${options.styles.sectionTitleMT || 16}px`,
                                                                marginBottom: `${options.styles.sectionTitleMB ?? 0}px`,
                                                                fontSize: `${options.styles.sectionTitle}pt`,
                                                                lineHeight: options.styles.sectionTitleLH,
                                                                fontFamily: getFontFamily(options.styles.sectionTitleFont),
                                                                fontWeight: options.styles.sectionTitleBold ? '800' : 'normal',
                                                                fontStyle: options.styles.sectionTitleItalic ? 'italic' : 'normal',
                                                                textDecoration: options.styles.sectionTitleUnderline ? 'underline' : 'none',
                                                                textAlign: options.styles.sectionTitleAlign as any,
                                                                color: options.styles.sectionTitleColor || '#6366f1'
                                                            }}>
                                                                {section.originalTitle.replace(/^###\s*/, '')}
                                                            </div>
                                                        )}
                                                        <InlineEditor
                                                            value={editingField?.lessonId === page.lesson.id && editingField?.field === 'facts' && editingField?.index === section.fIdx ? editingField.tempValue : (section.isUnified ? section.content : section.content.replace(/^### .*?(\n+|$)/, '').replace(/^\s*\*\*[^*]+\*\*(\n*)/, ''))}
                                                            isActive={editingField?.lessonId === page.lesson.id && editingField?.field === 'facts' && editingField?.index === section.fIdx}
                                                            isEditing={editingField?.field || null}
                                                            onEditToggle={(active) => setEditingField(active ? { lessonId: page.lesson.id, field: 'facts', index: section.fIdx, tempValue: section.content } : null)}
                                                            onChange={(val) => setEditingField(prev => prev ? { ...prev, tempValue: val } : null)}
                                                            markdown
                                                            multiline
                                                            className="text-zinc-600"
                                                            style={{
                                                                fontSize: `${options.styles.facts}pt`,
                                                                lineHeight: options.styles.factsLH,
                                                                fontWeight: getFs('Bold') ? 'bold' : 'normal',
                                                                fontStyle: getFs('Italic') ? 'italic' : 'normal',
                                                                textDecoration: getFs('Underline') ? 'underline' : 'none',
                                                                textAlign: (options.styles as any)[`${fKey}Align`] || 'left',
                                                                hyphens: 'auto',
                                                                fontFamily: getFontFamily(getFs('Font')),
                                                                height: section.manualHeight ? '100%' : 'auto',
                                                                headerStyles: options.styles // Pass global styles for markdown headers
                                                            }}
                                                        />
                                                        {/* Resize Handle - Improved Hit Area & Z-Index */}
                                                        <div
                                                            className="absolute -bottom-3 inset-x-0 h-6 cursor-ns-resize flex items-center justify-center group/resize z-[1000] no-print hover:bg-indigo-50/50 rounded-b-lg active:bg-indigo-100"
                                                            onMouseDown={(e) => {
                                                                if (e.button !== 0) return;
                                                                e.preventDefault();
                                                                e.stopPropagation();

                                                                const startY = e.clientY;
                                                                const parent = e.currentTarget.closest('.fact-item') as HTMLElement;
                                                                const startH = parent ? parent.offsetHeight : 0;
                                                                // Use sKey from closure
                                                                const sKey = getSectionKey(page.lesson.id, 'facts', section.fIdx, section.partIndex);

                                                                // Visual feedback
                                                                document.body.style.cursor = 'ns-resize';

                                                                const onMove = (moveEvent: MouseEvent) => {
                                                                    moveEvent.preventDefault();
                                                                    const diff = moveEvent.clientY - startY;
                                                                    const rawH = startH + diff;
                                                                    // Hard Clamp at UI level using pre-calculated maxPossibleHeight
                                                                    const limitH = section.maxPossibleHeight || 800;
                                                                    const clampedH = Math.min(limitH, rawH);
                                                                    const newH = Math.max(40, Math.round(clampedH / 4) * 4);

                                                                    // Direct State Update
                                                                    setSectionHeights(prev => {
                                                                        if (prev[sKey] === newH) return prev; // Avoid redundant updates
                                                                        return { ...prev, [sKey]: newH };
                                                                    });
                                                                };

                                                                const onUp = () => {
                                                                    document.body.style.cursor = '';
                                                                    window.removeEventListener('mousemove', onMove);
                                                                    window.removeEventListener('mouseup', onUp);
                                                                };

                                                                window.addEventListener('mousemove', onMove);
                                                                window.addEventListener('mouseup', onUp);
                                                            }}
                                                        >
                                                            <div className="w-16 h-1.5 bg-zinc-300 dark:bg-slate-600 group-hover/resize:bg-indigo-500 group-active/resize:bg-indigo-600 rounded-full transition-colors shadow-sm" />
                                                            <div className="absolute top-full text-[9px] font-mono bg-black text-white px-1 rounded opacity-0 group-hover/resize:opacity-100 group-active/resize:opacity-100 pointer-events-none z-[1001] mt-1">
                                                                {sectionHeights[getSectionKey(page.lesson.id, 'facts', section.fIdx, section.partIndex)] ? `${sectionHeights[getSectionKey(page.lesson.id, 'facts', section.fIdx, section.partIndex)]}px` : 'Auto'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            if (section.type === 'question') {
                                                return (
                                                    <div
                                                        key={stableKey}
                                                        className={`question-item relative group z-[20] hover:z-[100] !overflow-visible ${commonClasses('questions')}`}
                                                        style={getContainerStyle('questions', isSubsequent)}
                                                    >
                                                        <SectionToolbar
                                                            onScale={(val) => handleStyleChange('fontSize', val, 'questions')}
                                                            onLineHeight={(val) => handleStyleChange('lineHeight', val, 'questions')}
                                                            fontSize={options.styles.questions}
                                                            lineHeight={options.styles.questionsLH}
                                                            isEditing={editingField?.lessonId === page.lesson.id && editingField?.field === 'questions' && editingField?.index === section.qIdx}
                                                            isAnyEditing={!!editingField}
                                                            onSave={handleSaveEdit}
                                                            onCancel={handleCancelEdit}
                                                            bold={options.styles.questionsBold}
                                                            italic={options.styles.questionsItalic}
                                                            underline={options.styles.questionsUnderline}
                                                            align={options.styles.questionsAlign as 'left' | 'center' | 'right' | 'justify'}
                                                            hyphens={options.styles.questionsHyphens}
                                                            onToggleStyle={(s) => handleStyleToggle(s, 'questions')}
                                                            onChangeStyle={(s, v) => handleStyleChange(s, v, 'questions')}
                                                            type="question"
                                                            layoutCorrection={sectionLayouts[getSectionKey(page.lesson.id, 'question', section.qIdx, section.partIndex)] || 0}
                                                            onLayoutCorrection={(val) => setSectionLayouts(prev => ({ ...prev, [getSectionKey(page.lesson.id, 'question', section.qIdx, section.partIndex)]: val }))}
                                                            answerLines={options.answerLines}
                                                            onAnswerLines={(val) => setOptions(prev => ({ ...prev, answerLines: val }))}
                                                            answerLineSpacing={options.styles.answerLineSpacing}
                                                            onAnswerLineSpacing={(val) => setOptions(prev => ({ ...prev, styles: { ...prev.styles, answerLineSpacing: val } }))}
                                                            hasPageBreak={sectionPageBreaks[getSectionKey(page.lesson.id, 'question', section.qIdx)]}
                                                            onTogglePageBreak={() => togglePageBreak(getSectionKey(page.lesson.id, 'question', section.qIdx))}
                                                        />

                                                        {/* Questions Header - Only above first question */}
                                                        {(options.styles.questionsHeader && section.qIdx === 0 && section.partIndex === 0) && (
                                                            <InlineEditor
                                                                value={editingField?.lessonId === page.lesson.id && editingField?.field === 'questionsHeader' && editingField?.index === section.qIdx ? editingField.tempValue : (options.styles.questionsHeader || 'Fragen')}
                                                                isActive={editingField?.lessonId === page.lesson.id && editingField?.field === 'questionsHeader' && editingField?.index === section.qIdx}
                                                                isEditing={editingField?.field || null}
                                                                onChange={(val) => setEditingField(prev => prev ? { ...prev, tempValue: val } : null)}
                                                                onEditToggle={(isEditing) => {
                                                                    if (isEditing) {
                                                                        setEditingField({ lessonId: page.lesson.id, field: 'questionsHeader', index: section.qIdx, tempValue: options.styles.questionsHeader || 'Fragen' });
                                                                    } else {
                                                                        if (editingField?.tempValue !== undefined) {
                                                                            handleStyleChange('Header', editingField.tempValue, 'questions');
                                                                        }
                                                                        handleCancelEdit();
                                                                    }
                                                                }}
                                                                className="uppercase tracking-wide flex items-center gap-2"
                                                                style={{
                                                                    marginTop: `${options.styles.sectionTitleMT || 0}px`,
                                                                    marginBottom: `${options.styles.sectionTitleMB || 8}px`,
                                                                    fontSize: `${options.styles.sectionTitle}pt`,
                                                                    lineHeight: options.styles.sectionTitleLH,
                                                                    fontWeight: options.styles.sectionTitleBold ? '800' : 'normal',
                                                                    fontStyle: options.styles.sectionTitleItalic ? 'italic' : 'normal',
                                                                    textDecoration: options.styles.sectionTitleUnderline ? 'underline' : 'none',
                                                                    textAlign: options.styles.sectionTitleAlign as any,
                                                                    fontFamily: getFontFamily(options.styles.sectionTitleFont),
                                                                    color: options.styles.sectionTitleColor || '#6366f1'
                                                                }}
                                                            >
                                                                <MessageSquare size={14} className="shrink-0" />
                                                                <span>{options.styles.questionsHeader || 'Fragen'}</span>
                                                            </InlineEditor>
                                                        )}

                                                        <InlineEditor
                                                            value={editingField?.lessonId === page.lesson.id && editingField?.field === 'questions' && editingField?.index === section.qIdx ? editingField.tempValue : section.content}
                                                            isActive={editingField?.lessonId === page.lesson.id && editingField?.field === 'questions' && editingField?.index === section.qIdx}
                                                            isEditing={editingField?.field || null}
                                                            onEditToggle={(active) => setEditingField(active ? { lessonId: page.lesson.id, field: 'questions', index: section.qIdx, tempValue: section.content } : null)}
                                                            onChange={(val) => setEditingField(prev => prev ? { ...prev, tempValue: val } : null)}
                                                            multiline
                                                            className="question-text"
                                                            style={{
                                                                fontSize: `${options.styles.questions}pt`,
                                                                lineHeight: options.styles.questionsLH,
                                                                fontWeight: options.styles.questionsBold ? 'bold' : 'normal',
                                                                fontStyle: options.styles.questionsItalic ? 'italic' : 'normal',
                                                                textDecoration: options.styles.questionsUnderline ? 'underline' : 'none',
                                                                textAlign: options.styles.questionsAlign,
                                                                hyphens: options.styles.questionsHyphens ? 'auto' : 'manual',
                                                                fontFamily: getFontFamily(options.styles.questionsFont)
                                                            }}
                                                        />
                                                        {options.lineForAnswers && (
                                                            <div className="mt-4 flex flex-col pt-[0.2em]" style={{ gap: `${options.styles.answerLineSpacing || 1.5}rem` }}>
                                                                {Array.from({ length: options.answerLines }).map((_, i) => (
                                                                    <div key={i} className="border-b border-zinc-200 dark:border-slate-700 h-[1px] w-full" />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }

                                            if (section.type === 'quiz') return (
                                                <div key={stableKey} className="mb-6" style={{ fontSize: `${options.styles.quiz}pt`, ...getContainerStyle('quiz') }}>
                                                    <div className="uppercase tracking-wide" style={{
                                                        marginTop: `${options.styles.sectionTitleMT || 0}px`,
                                                        marginBottom: `${options.styles.sectionTitleMB || 8}px`,
                                                        fontSize: `${options.styles.sectionTitle}pt`,
                                                        lineHeight: options.styles.sectionTitleLH,
                                                        fontWeight: options.styles.sectionTitleBold ? 'bold' : 'normal',
                                                        fontStyle: options.styles.sectionTitleItalic ? 'italic' : 'normal',
                                                        textDecoration: options.styles.sectionTitleUnderline ? 'underline' : 'none',
                                                        textAlign: options.styles.sectionTitleAlign as any,
                                                        fontFamily: getFontFamily(options.styles.sectionTitleFont),
                                                        color: options.styles.sectionTitleColor || '#6366f1'
                                                    }}>Quiz</div>
                                                    {section.data.map((q: any) => (
                                                        <div key={q.id} className="space-y-4">
                                                            {q.questions.map((qq: any, qqIdx: number) => (
                                                                <div key={qqIdx}>
                                                                    <p className="font-medium text-sm mb-2">{qqIdx + 1}. {qq.question}</p>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        {qq.options.map((opt: string, optIdx: number) => (
                                                                            <div key={optIdx} className="flex items-center gap-2 text-xs">
                                                                                <div className="w-4 h-4 rounded border border-zinc-300" />
                                                                                <span>{opt}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            );

                                            if (section.type === 'memory') {
                                                const isConsecutiveMemory = section.index > 0 || section.partIndex > 0;
                                                return (
                                                    <div key={stableKey} className={`relative group z-[20] !overflow-visible ${commonClasses('memory')}`} style={getContainerStyle('memory', isConsecutiveMemory)}>
                                                        <SectionToolbar
                                                            onScale={(val) => handleStyleChange('fontSize', val, 'memory')}
                                                            onLineHeight={(val) => handleStyleChange('lineHeight', val, 'memory')}
                                                            fontSize={options.styles.memory}
                                                            lineHeight={options.styles.memoryLH}
                                                            isEditing={editingField?.lessonId === page.lesson.id && editingField?.field === 'memoryVerses' && editingField?.index === section.index}
                                                            isAnyEditing={!!editingField}
                                                            onSave={handleSaveEdit}
                                                            onCancel={handleCancelEdit}
                                                            bold={options.styles.memoryBold}
                                                            italic={options.styles.memoryItalic}
                                                            underline={options.styles.memoryUnderline}
                                                            align={options.styles.memoryAlign as 'left' | 'center' | 'right' | 'justify'}
                                                            hyphens={options.styles.memoryHyphens}
                                                            onToggleStyle={(s) => handleStyleToggle(s, 'memory')}
                                                            onChangeStyle={(s, v) => handleStyleChange(s, v, 'memory')}
                                                            type="memory"
                                                            layoutCorrection={sectionLayouts[getSectionKey(page.lesson.id, 'memory', section.index, section.partIndex)] || 0}
                                                            onLayoutCorrection={(val) => setSectionLayouts(prev => ({ ...prev, [getSectionKey(page.lesson.id, 'memory', section.index, section.partIndex)]: val }))}
                                                        />
                                                        <div className="uppercase tracking-wide flex items-center gap-2" style={{
                                                            marginTop: `${options.styles.sectionTitleMT || 0}px`,
                                                            marginBottom: `${options.styles.sectionTitleMB || 8}px`,
                                                            fontSize: `${options.styles.sectionTitle}pt`,
                                                            lineHeight: options.styles.sectionTitleLH,
                                                            fontWeight: options.styles.sectionTitleBold ? '800' : 'normal',
                                                            fontStyle: options.styles.sectionTitleItalic ? 'italic' : 'normal',
                                                            textDecoration: options.styles.sectionTitleUnderline ? 'underline' : 'none',
                                                            textAlign: options.styles.sectionTitleAlign as any,
                                                            fontFamily: getFontFamily(options.styles.sectionTitleFont),
                                                            color: options.styles.sectionTitleColor || '#6366f1'
                                                        }}>
                                                            <Star size={14} className="shrink-0" />
                                                            <span>Lernvers</span>
                                                        </div>
                                                        <InlineEditor
                                                            value={editingField?.lessonId === page.lesson.id && editingField?.field === 'memoryVerses' ? editingField.tempValue : section.content}
                                                            isActive={editingField?.lessonId === page.lesson.id && editingField?.field === 'memoryVerses'}
                                                            isEditing={editingField?.field || null}
                                                            onChange={(val) => setEditingField({
                                                                lessonId: page.lesson.id,
                                                                field: 'memoryVerses',
                                                                index: section.index, // Ensure index is passed for array updates
                                                                tempValue: val
                                                            })}
                                                            onEditToggle={(isEditing) => {
                                                                if (isEditing) {
                                                                    setEditingField({
                                                                        lessonId: page.lesson.id,
                                                                        field: 'memoryVerses',
                                                                        index: section.index,
                                                                        tempValue: section.content
                                                                    });
                                                                } else {
                                                                    // Handle cancel by clearing state
                                                                    handleCancelEdit();
                                                                }
                                                            }}
                                                            markdown={true}
                                                            multiline
                                                            className="font-serif italic text-lg text-center px-8"
                                                            style={{
                                                                fontSize: `${options.styles.memory}pt`,
                                                                lineHeight: options.styles.memoryLH,
                                                                fontWeight: options.styles.memoryBold ? 'bold' : 'normal',
                                                                fontStyle: options.styles.memoryItalic ? 'italic' : 'normal',
                                                                textDecoration: options.styles.memoryUnderline ? 'underline' : 'none',
                                                                textAlign: options.styles.memoryAlign,
                                                                hyphens: options.styles.memoryHyphens ? 'auto' : 'manual',
                                                                fontFamily: getFontFamily(options.styles.memoryFont)
                                                            }}
                                                        />
                                                    </div>
                                                );
                                            }

                                            // Render Notes Section
                                            if (section.type === 'notes') {
                                                const isConsecutiveNotes = (section.index || 0) > 0 || (section.partIndex || 0) > 0;
                                                return (
                                                    <div key={stableKey} className={`relative group z-[20] !overflow-visible ${commonClasses('notes')}`} style={getContainerStyle('notes', isConsecutiveNotes)}>
                                                        <SectionToolbar
                                                            onScale={(val) => handleStyleChange('fontSize', val, 'notes')}
                                                            onLineHeight={(val) => handleStyleChange('lineHeight', val, 'notes')}
                                                            fontSize={options.styles.notes}
                                                            lineHeight={options.styles.notesLH}
                                                            isEditing={editingField?.lessonId === page.lesson.id && editingField?.field === 'notesHeader'}
                                                            isAnyEditing={!!editingField}
                                                            onSave={handleSaveEdit}
                                                            onCancel={handleCancelEdit}
                                                            bold={options.styles.notesBold}
                                                            italic={options.styles.notesItalic}
                                                            underline={options.styles.notesUnderline}
                                                            align={options.styles.notesAlign as 'left' | 'center' | 'right' | 'justify'}
                                                            hyphens={false}
                                                            onToggleStyle={(s) => handleStyleToggle(s, 'notes')}
                                                            onChangeStyle={(s, v) => handleStyleChange(s, v, 'notes')}
                                                            type="notes"
                                                            layoutCorrection={sectionLayouts[getSectionKey(page.lesson.id, 'notes', 0, section.partIndex)] || 0}
                                                            onLayoutCorrection={(val) => setSectionLayouts(prev => ({ ...prev, [getSectionKey(page.lesson.id, 'notes', 0, section.partIndex)]: val }))}
                                                        />

                                                        {/* Notes Header - Always repeat on every part */}
                                                        <InlineEditor
                                                            value={editingField?.lessonId === page.lesson.id && editingField?.field === 'notesHeader' ? editingField.tempValue : (options.styles.notesHeader || 'Persönliche Notizen')}
                                                            isActive={editingField?.lessonId === page.lesson.id && editingField?.field === 'notesHeader'}
                                                            isEditing={editingField?.field || null}
                                                            onChange={(val) => setEditingField(prev => prev ? { ...prev, tempValue: val } : null)}
                                                            onEditToggle={(isEditing) => {
                                                                if (isEditing) {
                                                                    setEditingField({ lessonId: page.lesson.id, field: 'notesHeader', tempValue: options.styles.notesHeader || 'Persönliche Notizen' });
                                                                } else {
                                                                    if (editingField?.tempValue !== undefined) {
                                                                        handleStyleChange('Header', editingField.tempValue, 'notes');
                                                                    }
                                                                    handleCancelEdit();
                                                                }
                                                            }}
                                                            className="uppercase tracking-wide flex items-center gap-2"
                                                            style={{
                                                                marginTop: `${(section.index === 0 && (section.partIndex || 0) === 0) ? (options.styles.sectionTitleMT ?? 0) : (options.styles.sectionTitleMT ?? 8)}px`,
                                                                marginBottom: `${options.styles.sectionTitleMB || 8}px`,
                                                                fontSize: `${options.styles.sectionTitle}pt`,
                                                                lineHeight: options.styles.sectionTitleLH,
                                                                fontWeight: options.styles.sectionTitleBold ? '800' : 'normal',
                                                                fontStyle: options.styles.sectionTitleItalic ? 'italic' : 'normal',
                                                                textDecoration: options.styles.sectionTitleUnderline ? 'underline' : 'none',
                                                                textAlign: options.styles.sectionTitleAlign as any,
                                                                fontFamily: getFontFamily(options.styles.sectionTitleFont),
                                                                color: options.styles.sectionTitleColor || '#6366f1'
                                                            }}
                                                        >
                                                            <PenLine size={14} className="shrink-0" />
                                                            <span>{options.styles.notesHeader || 'Persönliche Notizen'}</span>
                                                        </InlineEditor>

                                                        {/* Note Lines */}
                                                        <div className="flex flex-col pt-4" style={{ gap: `${section.notesLineSpacing || 1.5}rem` }}>
                                                            {Array.from({ length: section.notesLines || 5 }).map((_, i) => (
                                                                <div key={i} className="border-b border-zinc-300 dark:border-slate-600 h-[1px] w-full" />
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return null;
                                        })}
                                    </div>

                                    <div
                                        className="absolute bottom-[5mm] left-0 right-0 flex justify-between text-[8px] text-zinc-400 border-t border-zinc-100 pt-3 bg-white z-10"
                                        style={{ marginLeft: '15mm', marginRight: '15mm' }}
                                    >
                                        <span className="font-medium tracking-tight">{page.lesson.title.split('---')[0].trim()}</span>
                                        <span className="font-bold">Seite {pageIdx + 1}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>

            {/* Mobile / Fullscreen Floating Settings Toggle */}
            <div className="no-print fixed bottom-10 right-4 z-[60]">
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={clsx(
                        "p-4 bg-white dark:bg-slate-800 rounded-full shadow-2xl text-indigo-600 border border-indigo-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all",
                        showSettings && "rotate-90"
                    )}
                >
                    <SettingsIcon size={24} />
                </button>
            </div>
        </div>
    );
}
