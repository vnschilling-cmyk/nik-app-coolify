"use client";

import { Bold, Italic, Underline, List, ListOrdered, Type } from "lucide-react";
import { useRef } from "react";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, label }: RichTextEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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

        // Restore focus and selection
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
        else lineStart += 1; // Skip the newline

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
        <div className="w-full">
            {label && <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">{label}</label>}
            <div className="border border-zinc-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                {/* Toolbar */}
                <div className="flex items-center gap-1 p-2 border-b border-zinc-100 dark:border-slate-700/50 bg-zinc-50 dark:bg-slate-800/50">
                    <ToolbarButton icon={<Bold size={16} />} onClick={() => insertFormat("**")} tooltip="Fett" />
                    <ToolbarButton icon={<Italic size={16} />} onClick={() => insertFormat("*")} tooltip="Kursiv" />
                    <ToolbarButton icon={<Underline size={16} />} onClick={() => insertFormat("<u>", "</u>")} tooltip="Unterstrichen" />
                    <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-600 mx-1" />
                    <ToolbarButton icon={<List size={16} />} onClick={() => insertList("bullet")} tooltip="Liste" />
                    <ToolbarButton icon={<ListOrdered size={16} />} onClick={() => insertList("number")} tooltip="Nummerierte Liste" />
                </div>

                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full p-3 bg-transparent border-none focus:ring-0 min-h-[150px] resize-y text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 font-sans"
                />
            </div>
            <p className="text-xs text-zinc-400 mt-1 text-right">Markdown unterstützt</p>
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
