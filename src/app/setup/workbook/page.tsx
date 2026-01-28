"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchWorkbookData, WorkbookLesson } from "@/lib/workbook";
import { ChevronLeft, Printer, Eye, Settings as SettingsIcon, GripVertical, Check, X, RefreshCw, Maximize2, Minimize2, Type, ChevronRight, BookOpen, Plus, Minus, Image as ImageIcon, Video, Link2, MapPin, Youtube, ChevronDown, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, WholeWord } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

// Simple Markdown Parser
const MarkdownRenderer = ({ content, className, style }: { content: string, className?: string, style?: any }) => {
    if (!content) return null;

    // Very basic markdown parsing
    let html = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/__(.*?)__/g, '<u>$1</u>')
        .replace(/\n/g, '<br />')
        .replace(/^- (.*)/gm, '<li>$1</li>')
        .replace(/^\d+\. (.*)/gm, '<li>$1</li>');

    // Wrap lists
    if (html.includes('<li>')) {
        // This is a naive way to wrap <li> tags, but works for simple cases
        // A better way would be a proper regex or parser
    }

    return (
        <div
            className={clsx("prose prose-sm max-w-none", className)}
            style={style}
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
    markdown = false
}: {
    value: string,
    isEditing: string | null,
    isActive: boolean,
    onEditToggle: (active: boolean) => void,
    onChange: (val: string) => void,
    multiline?: boolean,
    className?: string,
    style?: any,
    markdown?: boolean
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
        >
            {markdown ? (
                <MarkdownRenderer content={value} style={style} />
            ) : (
                <div style={style}>{value}</div>
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
    options,
    setOptions,
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
    onLayoutCorrection
}: {
    type: string,
    fontSize: number,
    lineHeight: number,
    onScale: (val: number) => void,
    onLineHeight: (val: number) => void,
    options: any,
    setOptions: any,
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
    onLayoutCorrection?: (val: number) => void
}) => {
    return (
        <div className={clsx(
            "no-print absolute top-0 right-[-16px] transition-all duration-300 z-[100] flex flex-col gap-2 p-3 bg-white dark:bg-slate-900 border-2 border-indigo-600 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:scale-105 origin-top-right",
            isEditing
                ? "opacity-100 visible pointer-events-auto"
                : (isAnyEditing
                    ? "opacity-0 invisible pointer-events-none"
                    : "opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-300 delay-300 group-hover:delay-0")
        )}>

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
                    >
                        <Plus size={14} strokeWidth={3} />
                    </button>
                    <span className="text-xs font-black text-zinc-900 dark:text-white min-w-[2rem] text-center">{fontSize}</span>
                    <button
                        onClick={() => onScale(Math.max(6, parseFloat((fontSize - 0.5).toFixed(1))))}
                        className="p-1.5 bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-lg transition-all"
                    >
                        <Minus size={14} strokeWidth={3} />
                    </button>
                </div>

                <div className="flex flex-col items-center gap-1.5 pl-4 pr-1">
                    <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Abstand</span>
                    <button
                        onClick={() => onLineHeight(parseFloat((lineHeight + 0.1).toFixed(1)))}
                        className="p-1.5 bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-lg transition-all"
                    >
                        <Plus size={14} strokeWidth={3} />
                    </button>
                    <span className="text-xs font-black text-zinc-900 dark:text-white min-w-[2rem] text-center">{lineHeight}</span>
                    <button
                        onClick={() => onLineHeight(Math.max(1.0, parseFloat((lineHeight - 0.1).toFixed(1))))}
                        className="p-1.5 bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-lg transition-all"
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

                    {onLayoutCorrection && typeof layoutCorrection === 'number' && (
                        <div className="flex flex-col gap-1 border-t border-zinc-100 dark:border-slate-800 pt-2">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Layout</span>
                                <span className="text-[9px] font-bold text-zinc-500">{layoutCorrection > 0 ? '+' : ''}{layoutCorrection}px</span>
                            </div>
                            <input
                                type="range"
                                min="-800"
                                max="800"
                                step="10"
                                value={layoutCorrection}
                                onChange={(e) => onLayoutCorrection(parseInt(e.target.value))}
                                className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                title="Nach links: Mehr Platz (weniger Text/Seite). Nach rechts: Weniger Platz (mehr Text/Seite)."
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
                                    onClick={() => setOptions((prev: any) => ({ ...prev, answerLines: Math.max(1, prev.answerLines - 1) }))}
                                    className="bg-indigo-50 dark:bg-slate-800 p-1.5 border border-indigo-100 dark:border-slate-700 rounded-lg text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                >
                                    <Minus size={12} strokeWidth={4} />
                                </button>
                                <span className="min-w-[1.2rem] text-center text-xs text-zinc-900 dark:text-white">{options.answerLines}</span>
                                <button
                                    onClick={() => setOptions((prev: any) => ({ ...prev, answerLines: Math.min(15, prev.answerLines + 1) }))}
                                    className="bg-indigo-50 dark:bg-slate-800 p-1.5 border border-indigo-100 dark:border-slate-700 rounded-lg text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                >
                                    <Plus size={12} strokeWidth={4} />
                                </button>
                            </div>

                            <div className="flex items-center gap-1 w-full justify-between px-1 border-t border-zinc-100 dark:border-slate-800 pt-2">
                                <span className="text-[8px] text-zinc-400 font-bold uppercase">Zeilen-Abstand</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setOptions((prev: any) => ({ ...prev, styles: { ...prev.styles, answerLineSpacing: Math.max(0.5, (prev.styles.answerLineSpacing || 1.0) - 0.2) } }))}
                                        className="p-1 bg-zinc-100 hover:bg-indigo-100 rounded text-indigo-600"
                                    >
                                        <Minus size={10} />
                                    </button>
                                    <span className="text-[9px] font-bold w-4 text-center">{(options.styles.answerLineSpacing || 1.0).toFixed(1)}</span>
                                    <button
                                        onClick={() => setOptions((prev: any) => ({ ...prev, styles: { ...prev.styles, answerLineSpacing: (prev.styles.answerLineSpacing || 1.0) + 0.2 } }))}
                                        className="p-1 bg-zinc-100 hover:bg-indigo-100 rounded text-indigo-600"
                                    >
                                        <Plus size={10} />
                                    </button>
                                </div>
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
    const [splitStrategy, setSplitStrategy] = useState<'paragraph' | 'sentence' | 'hyphens' | 'smart'>('smart');

    // Per-Section Layout Adjustments (Key: lessonId-type-index-partIndex)
    const [sectionLayouts, setSectionLayouts] = useState<Record<string, number>>({});

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
        // Detailed Font Sizes
        styles: {
            title: 16,
            titleLH: 1.2,
            titleBold: true,
            titleItalic: false,
            titleUnderline: false,
            titleAlign: 'justify',
            titleHyphens: true,

            intro: 10,
            introLH: 1.4,
            introBold: false,
            introItalic: true,
            introUnderline: false,
            introAlign: 'justify',
            introHyphens: true,

            bible: 10,
            bibleLH: 1.4,
            bibleBold: false,
            bibleItalic: true,
            bibleUnderline: false,
            bibleAlign: 'justify',
            bibleHyphens: true,

            facts: 10,
            factsLH: 1.3,
            factsBold: false,
            factsItalic: false,
            factsUnderline: false,
            factsAlign: 'justify',
            factsHyphens: true,

            questions: 11,
            questionsLH: 1.4,
            questionsBold: false,
            questionsItalic: false,
            questionsUnderline: false,
            questionsAlign: 'justify',
            questionsHyphens: true,
            answerLineSpacing: 1.5, // New setting

            quiz: 9,

            memory: 12,
            memoryLH: 1.5,
            memoryBold: false,
            memoryItalic: true,
            memoryUnderline: false,
            memoryAlign: 'center',
            memoryHyphens: true,
        },
        layoutCorrection: 0, // Manual Override for pagination sensitivity (-50 to +50)
    });

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

    // Pagination Logic: Dynamic Pixel-Based Calculation
    const getWorkbookPages = () => {
        const pages: { lesson: WorkbookLesson, sections: any[], pageNum: number }[] = [];
        // A5 Dimensions at 96 DPI
        const PAGE_HEIGHT_PX = 793;
        const MARGIN_Y_PX = 56 * 2; // 15mm top + 15mm bottom (~112px)
        // Base buffer 60px + Correction (Negative correction = More buffer = Less text)
        // Correction goes from -100 to +100.
        // If user wants MORE text (slider right, +100), we REDUCE the buffer.
        // If user wants LESS text (slider left, -100), we INCREASE the buffer.
        const effectiveBuffer = 60 - options.layoutCorrection;
        const CONTENT_HEIGHT_PX = PAGE_HEIGHT_PX - MARGIN_Y_PX - effectiveBuffer;
        const CONTENT_WIDTH_PX = 440;

        const SECTION_SPACING_PX = 32; // Overestimate spacing to be safe (CSS is 24px)
        const ITEM_SPACING_PX = 16;

        // Helper to estimate height
        const measureContentHeight = (text: string, fontSize: number, lineHeight: number, isBold: boolean, type: string, correctionPx: number = 0) => {
            if (!text) return 0;

            // Tuned Char Width: 0.6 is safer than 0.65 but still conservative
            const charWidth = fontSize * (isBold ? 0.85 : 0.8);
            const charsPerLine = Math.floor(CONTENT_WIDTH_PX / charWidth);

            // Basic line counting (soft wraps)
            // We split by newlines first to respect hard breaks
            const paragraphs = text.split('\n');
            let totalLines = 0;

            paragraphs.forEach(p => {
                const pLen = p.length;
                let lineCount = 0;

                // Markdown specific checks
                if (p.startsWith('#')) {
                    // Header: Counts as 2 lines (bigger font + margin)
                    lineCount = 2 + Math.ceil(pLen * 1.5 / charsPerLine);
                } else if (p.match(/^(\-|\*|\d+\.)\s/)) {
                    // List Item: Counts as 1.5 lines (margin + bullet)
                    lineCount = 1.5 + Math.ceil(pLen / charsPerLine);
                } else if (pLen === 0) {
                    lineCount = 1; // Empty line
                } else {
                    lineCount = Math.ceil(pLen / charsPerLine);
                }
                totalLines += lineCount;
            });

            // Height = lines * line-height-px
            // 1pt = 1.33px roughly
            // Factor 1.35x for safe line-height calculation
            const lineHeightPx = fontSize * 1.33 * lineHeight * 1.05;

            // Add spacing for Markdown paragraphs (approx 1 line height per paragraph break)
            // paragraphs array from split() includes empty strings for double newlines
            // Real paragraphs > 0
            const realParagraphCount = paragraphs.filter(p => p.length > 0).length;
            // Assuming mb-4 or similar roughly equals line height of 24px
            const totalParagraphSpacing = Math.max(0, realParagraphCount - 1) * (lineHeightPx * 0.8);

            // Apply Correction: Negative correction ADDS height (simulating more space needed, forcing break earlier)
            // Positive correction REDUCES height (simulating less space, fitting more)
            // Wait, previous logic was: buffer - correction.
            // Here we return CONSUMED height.
            // If user wants MORE text on page (slider right, +100), we pretend the text takes LESS space.
            // So we SUBTRACT correction from the estimated height.
            let height = (totalLines * lineHeightPx) + totalParagraphSpacing - correctionPx;

            // Add padding for specific types
            if (type === 'bible') height += 32; // Box padding
            if (type === 'memory') height += 24; // Box padding

            // Safety floor
            return Math.max(10, height);
        };

        const splitTextForHeight = (text: string, availableHeight: number, fontSize: number, lineHeight: number, isBold: boolean) => {
            // Must match measureContentHeight logic to prevent overflow
            // Factor 1.05 and basic line height
            const lineHeightPx = fontSize * 1.33 * lineHeight * 1.05;

            // Heuristic for paragraph spacing reduction
            // Reduce available height by ~10% to reserve space for paragraph gaps if we have multiple breaks
            const safeAvailableHeight = availableHeight * 0.90;

            const maxLines = Math.floor(safeAvailableHeight / lineHeightPx);

            if (maxLines <= 0) return { fit: '', remainder: text };

            const charWidth = fontSize * (isBold ? 0.85 : 0.8);
            const charsPerLine = Math.floor(CONTENT_WIDTH_PX / charWidth);
            const maxChars = maxLines * charsPerLine;

            let splitIdx = -1;

            if (splitStrategy === 'paragraph') {
                splitIdx = text.lastIndexOf('\n\n', maxChars);
            } else if (splitStrategy === 'sentence') {
                splitIdx = text.lastIndexOf('. ', maxChars);
                if (splitIdx !== -1) splitIdx += 1;
            } else if (splitStrategy === 'hyphens') {
                splitIdx = text.lastIndexOf(' ', maxChars);
                if (splitIdx === -1 || splitIdx < maxChars * 0.9) splitIdx = maxChars;
            } else {
                // SMART (Default)
                splitIdx = text.lastIndexOf('\n\n', maxChars);
                if (splitIdx === -1 || splitIdx < maxChars * 0.6) {
                    const sentenceBreak = text.lastIndexOf('. ', maxChars);
                    if (sentenceBreak !== -1) splitIdx = sentenceBreak + 1;
                }
                if (splitIdx === -1) {
                    splitIdx = text.lastIndexOf(' ', maxChars);
                }
            }

            // Fallback / Hard Limit
            if (splitIdx === -1) splitIdx = maxChars;
            if (splitIdx > text.length) splitIdx = text.length;

            // Orphan Protection: Check if we are splitting right after a number (e.g. "2.")
            // If the fit text ends with a pattern like "\n2." or " 2.", move the split back.
            const fitText = text.substring(0, splitIdx);

            // Regex for list markers at end of string (e.g. " 1.", "\n2.")
            // Matches digit + dot + optional space at end
            const orphanMatch = fitText.match(/(\s|\n)\d+\.\s*$/);
            if (orphanMatch) {
                // Move split index back to exclude the orphan
                splitIdx -= orphanMatch[0].length;
            }

            return {
                fit: text.substring(0, splitIdx).trim(),
                remainder: text.substring(splitIdx).trim()
            };
        };

        lessons.forEach((lesson) => {
            let currentPageSections: any[] = [];
            let pageNum = 1;
            let currentHeight = 0;

            const pushPage = () => {
                if (currentPageSections.length > 0) {
                    pages.push({ lesson, sections: [...currentPageSections], pageNum });
                    currentPageSections = [];
                    pageNum++;
                    currentHeight = 0;
                }
            };

            const addBlock = (type: string, content: string, fieldName: string, meta: any, styleObj: any) => {
                if (!content) return;

                // Parse styles specific to this section type
                const fs = styleObj[`${type}`] || 10;
                const lh = styleObj[`${type}LH`] || 1.4;
                const bold = styleObj[`${type}Bold`] || false;

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

                        const estimatedH = measureContentHeight(remainingText, fs, lh, bold, type, options.layoutCorrection + localCorrection);
                        const isStartOfPage = currentHeight === 0;
                        const spacing = isStartOfPage ? 0 : SECTION_SPACING_PX;
                        const neededTotal = estimatedH + spacing;
                        const remainingPageSpace = CONTENT_HEIGHT_PX - currentHeight;

                        // Case 1: Applies on current page
                        if (neededTotal <= remainingPageSpace) {
                            currentHeight += neededTotal;
                            currentPageSections.push({ type, content: remainingText, fieldName, ...meta, partIndex: currentPartIndex });
                            remainingText = '';
                            currentPartIndex++;
                        }
                        // Case 2: Defined structure (Image, Quiz) that shouldn't be split -> Push Page
                        else if (type === 'quiz' || type === 'image') {
                            pushPage();
                            // Add to new page
                            currentHeight += (estimatedH + SECTION_SPACING_PX); // Assuming it fits on a fresh page
                            currentPageSections.push({ type, content: remainingText, fieldName, ...meta, partIndex: currentPartIndex });
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

                            const { fit, remainder } = splitTextForHeight(remainingText, spaceForText + options.layoutCorrection + localCorrection, fs, lh, bold);

                            if (fit.length > 0) {
                                currentHeight += remainingPageSpace; // Determine page is full
                                currentPageSections.push({ type, content: fit, fieldName, ...meta, partIndex: currentPartIndex });
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

            // 4. Facts
            if (options.showFacts) {
                lesson.facts.forEach((f, fIdx) => {
                    const mediaType = f.type || 'text';
                    const isVisible =
                        (mediaType === 'text' && options.mediaFilters.text) ||
                        ((mediaType === 'image' || mediaType === 'bild') && options.mediaFilters.image) ||
                        ((mediaType === 'video' || mediaType === 'yt') && options.mediaFilters.video) ||
                        (mediaType === 'link' && options.mediaFilters.link) ||
                        (mediaType === 'map' && options.mediaFilters.map);

                    if (isVisible) {
                        // Title of Fact
                        if (f.title) {
                            // Treat title as bold text, small spacing
                            // We'll just append it to content or render separate? 
                            // Current renderer handles bold title inline or block.
                            // Let's assume the 'fact' block handles title + desc rendering
                            // We might want to pass them together?
                            // Simplified: We treat f.description as main content, pass title in meta
                            // But for height calculation, we should account for title height!
                            // Use a temp consolidated string for height estimation?
                            // Or just add title length to description?

                            // Let's format manually for estimation:
                            const fullContent = (f.title ? `### ${f.title}\n\n` : '') + f.description;
                            addBlock('facts', fullContent, 'facts', { fIdx, mediaType, originalTitle: f.title, isFact: true }, options.styles);
                        } else {
                            addBlock('facts', f.description, 'facts', { fIdx, mediaType, isFact: true }, options.styles);
                        }
                    }
                });
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
                    const answerHeight = (options.lineForAnswers) ? (lineCount * 28 * lineSpacing) : 0;

                    // We need a custom logic for Question + Answer block because we shouldn't split a question from its answer lines if possible
                    // But we might split the question text itself?
                    // Better to treat (Question + AnswerSpaces) as an atomic block if it fits

                    const sKey = getSectionKey(lesson.id, 'question', qIdx);
                    const localCorrection = sectionLayouts[sKey] || 0;

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
            "min-h-screen flex flex-col transition-colors duration-500",
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
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 ml-2"
                    >
                        <Printer size={18} />
                        <span className="hidden sm:inline">PDF / Drucken</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
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

                {/* Settings Drawer Overlay */}
                {showSettings && (
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[70] no-print transition-opacity"
                        onClick={() => setShowSettings(false)}
                    />
                )}

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
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Sichtbarkeit</h3>
                        {[
                            { id: 'einführung', label: 'Einleitung', toggleKey: 'showIntro' },
                            { id: 'bibeltext', label: 'Bibeltext', toggleKey: 'showBibleText' },
                            { id: 'infos', label: 'Infos & Medien', toggleKey: 'showFacts', isAccordion: true },
                            { id: 'fragen', label: 'Fragen', toggleKey: 'showQuestions' },
                            { id: 'lernvers', label: 'Lernvers', toggleKey: 'showMemoryVerses' },
                        ].map((section) => (
                            <div key={section.id} className="space-y-2">
                                <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-slate-800/50 rounded-xl transition-all">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-semibold">{section.label}</span>
                                        {section.id === 'infos' && (
                                            <button
                                                onClick={() => toggleSettingsSection('infos')}
                                                className={clsx(
                                                    "p-1 hover:bg-zinc-200 dark:hover:bg-slate-700 rounded-md transition-transform",
                                                    openSections.infos ? "rotate-180" : "rotate-0"
                                                )}
                                            >
                                                <ChevronDown size={14} className="text-indigo-600" />
                                            </button>
                                        )}
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

                                {section.id === 'infos' && openSections.infos && (
                                    <div className="pl-4 pr-1 py-1 space-y-2 border-l-2 border-indigo-100 dark:border-slate-800 ml-4">
                                        {[
                                            { id: 'text', label: 'Texte', icon: Type },
                                            { id: 'image', label: 'Bilder', icon: ImageIcon },
                                            { id: 'video', label: 'Videos', icon: Youtube },
                                            { id: 'link', label: 'Links', icon: Link2 },
                                            { id: 'map', label: 'Karten', icon: MapPin },
                                        ].map((media) => (
                                            <div key={media.id} className="flex items-center justify-between p-2 hover:bg-zinc-50 dark:hover:bg-slate-800/30 rounded-lg group">
                                                <div className="flex items-center gap-2">
                                                    <media.icon size={14} className="text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                                                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{media.label}</span>
                                                </div>
                                                <div
                                                    onClick={() => setOptions((prev: any) => ({
                                                        ...prev,
                                                        mediaFilters: {
                                                            ...prev.mediaFilters,
                                                            [media.id]: !prev.mediaFilters[media.id as keyof typeof prev.mediaFilters]
                                                        }
                                                    }))}
                                                    className={clsx(
                                                        "w-10 h-5 rounded-full relative transition-colors cursor-pointer",
                                                        options.mediaFilters[media.id as keyof typeof options.mediaFilters] ? "bg-indigo-600" : "bg-zinc-200 dark:bg-slate-700"
                                                    )}
                                                >
                                                    <div className={clsx(
                                                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-transform",
                                                        options.mediaFilters[media.id as keyof typeof options.mediaFilters] ? "left-6" : "left-1"
                                                    )} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="pt-6 border-t border-zinc-100 dark:border-slate-800">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1 mb-4">Anzeige & PDF</h3>
                        <div className="flex flex-col gap-4">
                            {/* Layout Correction Slider */}
                            <div className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 rounded-xl p-3 shadow-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-[10px] uppercase font-bold text-zinc-400">Layout-Korrektur</h4>
                                    <span className="text-[10px] bg-indigo-50 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 font-bold">
                                        {options.layoutCorrection > 0 ? '+' : ''}{options.layoutCorrection}px
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="-100"
                                    max="100"
                                    step="10"
                                    value={options.layoutCorrection}
                                    onChange={(e) => setOptions(prev => ({ ...prev, layoutCorrection: parseInt(e.target.value) }))}
                                    className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mb-1"
                                />
                                <div className="flex justify-between text-[8px] text-zinc-400 font-medium">
                                    <span>Zu viel Text (Footer)</span>
                                    <span>Zu viel Weißraum</span>
                                </div>
                            </div>

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
                    "flex-1 flex flex-col items-center scroll-smooth transition-all overflow-y-auto no-scrollbar pb-96",
                    isFullscreen ? "p-0 bg-zinc-200 dark:bg-slate-900" : "p-4 md:p-8 lg:px-20 xl:px-40 bg-zinc-100 dark:bg-slate-950"
                )}>
                    {/* Spacer for top margin */}
                    <div className={isFullscreen ? "h-10 min-h-[40px]" : "h-4"} />

                    {/* Scale Container to prevent horizontal scrollbars */}
                    <div
                        className="transition-all duration-500 relative"
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
                                <div key={`${page.lesson.id}-${page.pageNum}`} className="workbook-a5-page shadow-2xl print:shadow-none border border-zinc-200 dark:border-slate-800">
                                    <div
                                        className="workbook-content"
                                        style={{ fontSize: `${options.fontSize}pt` }}
                                    >
                                        {page.sections.map((section, sIdx) => {
                                            // Generate Stable Key
                                            const sectionMetaIndex = (section.fIdx !== undefined) ? section.fIdx : (section.qIdx !== undefined ? section.qIdx : (section.index !== undefined ? section.index : 0));
                                            const sectionPartIndex = section.partIndex || 0;
                                            const stableKey = `${section.type}-${sectionMetaIndex}-${sectionPartIndex}`;

                                            if (section.type === 'title') return (
                                                <div key={stableKey} className="mb-6 relative group">
                                                    <SectionToolbar
                                                        type="title"
                                                        fontSize={options.styles.title}
                                                        lineHeight={options.styles.titleLH}
                                                        onScale={(val) => setOptions(prev => ({ ...prev, styles: { ...prev.styles, title: val } }))}
                                                        onLineHeight={(val) => setOptions(prev => ({ ...prev, styles: { ...prev.styles, titleLH: val } }))}
                                                        options={options}
                                                        setOptions={setOptions}
                                                        isEditing={editingField?.lessonId === page.lesson.id && editingField?.field === 'title'}
                                                        isAnyEditing={!!editingField}
                                                        onSave={handleSaveEdit}
                                                        onCancel={handleCancelEdit}
                                                        bold={options.styles.titleBold}
                                                        italic={options.styles.titleItalic}
                                                        underline={options.styles.titleUnderline}
                                                        onToggleStyle={(s) => setOptions(prev => ({ ...prev, styles: { ...prev.styles, [`title${s.charAt(0).toUpperCase() + s.slice(1)}`]: !(prev.styles as any)[`title${s.charAt(0).toUpperCase() + s.slice(1)}`] } }))}
                                                        onChangeStyle={(style, val) => setOptions(prev => ({ ...prev, styles: { ...prev.styles, [`title${style.charAt(0).toUpperCase() + style.slice(1)}`]: val } }))}
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
                                                            hyphens: options.styles.titleHyphens ? 'auto' : 'manual'
                                                        }}
                                                    />
                                                </div>
                                            );

                                            if (section.type === 'intro') return (
                                                <div key={stableKey} className="mb-4 border-l-2 border-indigo-100 pl-4 relative group">
                                                    <SectionToolbar
                                                        type="intro"
                                                        fontSize={options.styles.intro}
                                                        lineHeight={options.styles.introLH}
                                                        onScale={(val) => setOptions(prev => ({ ...prev, styles: { ...prev.styles, intro: val } }))}
                                                        onLineHeight={(val) => setOptions(prev => ({ ...prev, styles: { ...prev.styles, introLH: val } }))}
                                                        options={options}
                                                        setOptions={setOptions}
                                                        isEditing={editingField?.lessonId === page.lesson.id && editingField?.field === 'content'}
                                                        isAnyEditing={!!editingField}
                                                        onSave={handleSaveEdit}
                                                        onCancel={handleCancelEdit}
                                                        bold={options.styles.introBold}
                                                        italic={options.styles.introItalic}
                                                        underline={options.styles.introUnderline}
                                                        onToggleStyle={(s) => setOptions(prev => ({ ...prev, styles: { ...prev.styles, [`intro${s.charAt(0).toUpperCase() + s.slice(1)}`]: !(prev.styles as any)[`intro${s.charAt(0).toUpperCase() + s.slice(1)}`] } }))}
                                                        onChangeStyle={(style, val) => setOptions(prev => ({ ...prev, styles: { ...prev.styles, [`intro${style.charAt(0).toUpperCase() + style.slice(1)}`]: val } }))}
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
                                                            hyphens: options.styles.introHyphens ? 'auto' : 'manual'
                                                        }}
                                                    />
                                                </div>
                                            );

                                            if (section.type === 'bible') return (
                                                <div key={stableKey} className="mb-4 p-4 bg-zinc-50 rounded-lg border border-zinc-100 italic relative group">
                                                    <SectionToolbar
                                                        type="bible"
                                                        fontSize={options.styles.bible}
                                                        lineHeight={options.styles.bibleLH}
                                                        onScale={(val) => setOptions(prev => ({ ...prev, styles: { ...prev.styles, bible: val } }))}
                                                        onLineHeight={(val) => setOptions(prev => ({ ...prev, styles: { ...prev.styles, bibleLH: val } }))}
                                                        options={options}
                                                        setOptions={setOptions}
                                                        isEditing={editingField?.lessonId === page.lesson.id && editingField?.field === 'bible'}
                                                        isAnyEditing={!!editingField}
                                                        onSave={handleSaveEdit}
                                                        onCancel={handleCancelEdit}
                                                        bold={options.styles.bibleBold}
                                                        italic={options.styles.bibleItalic}
                                                        underline={options.styles.bibleUnderline}
                                                        onToggleStyle={(s) => setOptions(prev => ({ ...prev, styles: { ...prev.styles, [`bible${s.charAt(0).toUpperCase() + s.slice(1)}`]: !(prev.styles as any)[`bible${s.charAt(0).toUpperCase() + s.slice(1)}`] } }))}
                                                        onChangeStyle={(style, val) => setOptions(prev => ({ ...prev, styles: { ...prev.styles, [`bible${style.charAt(0).toUpperCase() + style.slice(1)}`]: val } }))}
                                                        layoutCorrection={sectionLayouts[getSectionKey(page.lesson.id, 'bible', 0, section.partIndex)] || 0}
                                                        onLayoutCorrection={(val) => setSectionLayouts(prev => ({ ...prev, [getSectionKey(page.lesson.id, 'bible', 0, section.partIndex)]: val }))}
                                                    />
                                                    <div className="flex items-center gap-2 text-indigo-600 font-bold mb-3 uppercase tracking-wider text-xs not-italic">
                                                        <BookOpen size={14} />
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
                                                            hyphens: options.styles.bibleHyphens ? 'auto' : 'manual'
                                                        }}
                                                    />
                                                </div>
                                            );

                                            if (section.type === 'facts') return (
                                                <div key={stableKey} className="mb-4 fact-item relative group">
                                                    <SectionToolbar
                                                        type="facts"
                                                        fontSize={options.styles.facts}
                                                        lineHeight={options.styles.factsLH}
                                                        onScale={(val) => setOptions(prev => ({ ...prev, styles: { ...prev.styles, facts: val } }))}
                                                        onLineHeight={(val) => setOptions(prev => ({ ...prev, styles: { ...prev.styles, factsLH: val } }))}
                                                        options={options}
                                                        setOptions={setOptions}
                                                        isEditing={editingField?.lessonId === page.lesson.id && editingField?.field === 'facts' && editingField?.index === section.fIdx}
                                                        isAnyEditing={!!editingField}
                                                        onSave={handleSaveEdit}
                                                        onCancel={handleCancelEdit}
                                                        bold={options.styles.factsBold}
                                                        italic={options.styles.factsItalic}
                                                        underline={options.styles.factsUnderline}
                                                        onToggleStyle={(s) => setOptions(prev => ({ ...prev, styles: { ...prev.styles, [`facts${s.charAt(0).toUpperCase() + s.slice(1)}`]: !(prev.styles as any)[`facts${s.charAt(0).toUpperCase() + s.slice(1)}`] } }))}
                                                        onChangeStyle={(style, val) => setOptions(prev => ({ ...prev, styles: { ...prev.styles, [`facts${style.charAt(0).toUpperCase() + style.slice(1)}`]: val } }))}
                                                        layoutCorrection={sectionLayouts[getSectionKey(page.lesson.id, 'facts', section.fIdx, section.partIndex)] || 0}
                                                        onLayoutCorrection={(val) => setSectionLayouts(prev => ({ ...prev, [getSectionKey(page.lesson.id, 'facts', section.fIdx, section.partIndex)]: val }))}
                                                    />
                                                    {section.isFact && section.originalTitle && (
                                                        <h5 className="font-bold text-sm mb-1">{section.originalTitle.replace('### ', '')}</h5>
                                                    )}
                                                    <InlineEditor
                                                        value={editingField?.lessonId === page.lesson.id && editingField?.field === 'facts' && editingField?.index === section.fIdx ? editingField.tempValue : section.content.replace(/^### .*?\n\n/, '')}
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
                                                            fontWeight: options.styles.factsBold ? 'bold' : 'normal',
                                                            fontStyle: options.styles.factsItalic ? 'italic' : 'normal',
                                                            textDecoration: options.styles.factsUnderline ? 'underline' : 'none',
                                                            textAlign: options.styles.factsAlign,
                                                            hyphens: options.styles.factsHyphens ? 'auto' : 'manual'
                                                        }}
                                                    />
                                                </div>
                                            );

                                            if (section.type === 'question') return (
                                                <div
                                                    key={stableKey}
                                                    className="mb-4 question-item relative group"
                                                    style={{ width: `${options.answerWidth}%` }}
                                                >
                                                    <SectionToolbar
                                                        type="question"
                                                        fontSize={options.styles.questions}
                                                        lineHeight={options.styles.questionsLH}
                                                        onScale={(val) => setOptions(prev => ({ ...prev, styles: { ...prev.styles, questions: val } }))}
                                                        onLineHeight={(val) => setOptions(prev => ({ ...prev, styles: { ...prev.styles, questionsLH: val } }))}
                                                        options={options}
                                                        setOptions={setOptions}
                                                        isEditing={editingField?.lessonId === page.lesson.id && editingField?.field === 'questions' && editingField?.index === section.qIdx}
                                                        isAnyEditing={!!editingField}
                                                        onSave={handleSaveEdit}
                                                        onCancel={handleCancelEdit}
                                                        bold={options.styles.questionsBold}
                                                        italic={options.styles.questionsItalic}
                                                        underline={options.styles.questionsUnderline}
                                                        onToggleStyle={(s) => setOptions(prev => ({ ...prev, styles: { ...prev.styles, [`questions${s.charAt(0).toUpperCase() + s.slice(1)}`]: !(prev.styles as any)[`questions${s.charAt(0).toUpperCase() + s.slice(1)}`] } }))}
                                                        onChangeStyle={(style, val) => setOptions(prev => ({ ...prev, styles: { ...prev.styles, [`questions${style.charAt(0).toUpperCase() + style.slice(1)}`]: val } }))}
                                                        layoutCorrection={sectionLayouts[getSectionKey(page.lesson.id, 'question', section.qIdx, section.partIndex)] || 0}
                                                        onLayoutCorrection={(val) => setSectionLayouts(prev => ({ ...prev, [getSectionKey(page.lesson.id, 'question', section.qIdx, section.partIndex)]: val }))}
                                                    />
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
                                                            hyphens: options.styles.questionsHyphens ? 'auto' : 'manual'
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

                                            if (section.type === 'quiz') return (
                                                <div key={stableKey} className="mb-6" style={{ fontSize: `${options.styles.quiz}pt` }}>
                                                    <h3 className="section-title">Quiz</h3>
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

                                            if (section.type === 'memory') return (
                                                <div key={stableKey} className="mb-4 p-4 bg-indigo-50 border-2 border-indigo-200 rounded-xl relative group">
                                                    <SectionToolbar
                                                        type="memory"
                                                        fontSize={options.styles.memory}
                                                        lineHeight={options.styles.memoryLH}
                                                        onScale={(val) => setOptions(prev => ({ ...prev, styles: { ...prev.styles, memory: val } }))}
                                                        onLineHeight={(val) => setOptions(prev => ({ ...prev, styles: { ...prev.styles, memoryLH: val } }))}
                                                        options={options}
                                                        setOptions={setOptions}
                                                        isEditing={editingField?.lessonId === page.lesson.id && editingField?.field === 'memoryVerses' && editingField?.index === section.index}
                                                        isAnyEditing={!!editingField}
                                                        onSave={handleSaveEdit}
                                                        onCancel={handleCancelEdit}
                                                        bold={options.styles.memoryBold}
                                                        italic={options.styles.memoryItalic}
                                                        underline={options.styles.memoryUnderline}
                                                        onToggleStyle={(s) => setOptions(prev => ({ ...prev, styles: { ...prev.styles, [`memory${s.charAt(0).toUpperCase() + s.slice(1)}`]: !(prev.styles as any)[`memory${s.charAt(0).toUpperCase() + s.slice(1)}`] } }))}
                                                        onChangeStyle={(style, val) => setOptions(prev => ({ ...prev, styles: { ...prev.styles, [`memory${style.charAt(0).toUpperCase() + style.slice(1)}`]: val } }))}
                                                        layoutCorrection={sectionLayouts[getSectionKey(page.lesson.id, 'memory', section.index, section.partIndex)] || 0}
                                                        onLayoutCorrection={(val) => setSectionLayouts(prev => ({ ...prev, [getSectionKey(page.lesson.id, 'memory', section.index, section.partIndex)]: val }))}
                                                    />
                                                    <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">Lernvers</div>
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
                                                            hyphens: options.styles.memoryHyphens ? 'auto' : 'manual'
                                                        }}
                                                    />
                                                </div>
                                            );

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
