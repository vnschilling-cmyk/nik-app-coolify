"use client";

import { Bold, Italic, Underline, List, ListOrdered, Type, Maximize2, Minimize2, AlignLeft, AlignCenter, AlignRight, AlignJustify, WrapText } from "lucide-react";
import { useRef, useState } from "react";
import clsx from "clsx";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, label, expandOnFocus }: RichTextEditorProps & { expandOnFocus?: boolean }) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const insertFormat = (startTag: string, endTag: string = startTag) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const selection = text.substring(start, end);
        const after = text.substring(end);

        const newText = before + startTag + selection + endTag + after;
        onChange(newText);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + startTag.length, end + startTag.length);
        }, 0);
    };

    const insertList = (type: "bullet" | "number") => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const text = textarea.value;

        // Find start of current line
        let lineStart = text.lastIndexOf("\n", start - 1);
        if (lineStart === -1) lineStart = 0;
        else lineStart += 1;

        const prefix = type === "bullet" ? "- " : "1. ";
        const before = text.substring(0, lineStart);
        const after = text.substring(lineStart);

        onChange(before + prefix + after);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, start + prefix.length);
        }, 0);
    };

    return (
        <div className={clsx("w-full transition-all duration-300", isFullscreen && "fixed inset-0 z-[100] bg-white dark:bg-slate-900 flex flex-col p-4 animate-in fade-in zoom-in-95 duration-200")}>
            {isFullscreen && (
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <p className="text-xl font-bold text-zinc-800 dark:text-white">Bearbeiten</p>
                        {label && <p className="text-sm text-zinc-500">{label}</p>}
                    </div>
                    <button
                        onClick={() => setIsFullscreen(false)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition"
                    >
                        Fertig
                    </button>
                </div>
            )}

            {!isFullscreen && label && <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">{label}</label>}

            <div className={clsx(
                "border border-zinc-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800 transition-all flex flex-col",
                isFullscreen ? "flex-1 shadow-none border-none" : "focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500"
            )}>
                {/* Toolbar */}
                <div className="flex items-center gap-1 p-2 border-b border-zinc-100 dark:border-slate-700/50 bg-zinc-50 dark:bg-slate-800/50 flex-none">
                    <ToolbarButton icon={<Bold size={16} />} onClick={() => insertFormat("**")} tooltip="Fett" />
                    <ToolbarButton icon={<Italic size={16} />} onClick={() => insertFormat("*")} tooltip="Kursiv" />
                    <ToolbarButton icon={<Underline size={16} />} onClick={() => insertFormat("<u>", "</u>")} tooltip="Unterstrichen" />
                    <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-600 mx-1" />
                    <ToolbarButton icon={<List size={16} />} onClick={() => insertList("bullet")} tooltip="Liste" />
                    <ToolbarButton icon={<ListOrdered size={16} />} onClick={() => insertList("number")} tooltip="Nummerierte Liste" />
                    <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-600 mx-1" />
                    <ToolbarButton icon={<AlignLeft size={16} />} onClick={() => insertFormat("[left]", "[/left]")} tooltip="Linksbündig" />
                    <ToolbarButton icon={<AlignCenter size={16} />} onClick={() => insertFormat("[center]", "[/center]")} tooltip="Zentriert" />
                    <ToolbarButton icon={<AlignRight size={16} />} onClick={() => insertFormat("[right]", "[/right]")} tooltip="Rechtsbündig" />
                    <ToolbarButton icon={<AlignJustify size={16} />} onClick={() => insertFormat("[justify]", "[/justify]")} tooltip="Blocksatz" />
                    <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-600 mx-1" />
                    <ToolbarButton icon={<WrapText size={16} />} onClick={() => insertFormat("[hyphen]", "[/hyphen]")} tooltip="Silbentrennung" />
                    <div className="flex-1" />
                    <ToolbarButton
                        icon={isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        tooltip={isFullscreen ? "Minimieren" : "Vollbild"}
                    />
                </div>

                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => {
                        if (expandOnFocus && !isFullscreen) setIsFullscreen(true);
                    }}
                    placeholder={placeholder}
                    className={clsx(
                        "w-full p-3 bg-transparent border-none focus:ring-0 resize-y text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 font-sans",
                        isFullscreen ? "flex-1 resize-none text-lg leading-relaxed p-6" : "min-h-[150px]"
                    )}
                />
            </div>
            {!isFullscreen && <p className="text-xs text-zinc-400 mt-1 text-right">Markdown unterstützt</p>}
        </div>
    );
}

function ToolbarButton({ icon, onClick, tooltip }: { icon: React.ReactNode, onClick: () => void, tooltip: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={tooltip}
            className="p-1.5 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
        >
            {icon}
        </button>
    );
}
