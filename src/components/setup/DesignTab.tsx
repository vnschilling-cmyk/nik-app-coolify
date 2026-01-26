"use client";

import { useDesign, Theme, FontFamily } from "@/context/DesignContext";
import { Moon, Sun, Monitor, Type, Bold, Italic, Underline, Check, ChevronDown, Palette } from "lucide-react";
import { useState, useRef, useEffect } from "react";

// Helper Component for Dropdown
function FontDropdown({
    label,
    value,
    onChange,
    options
}: {
    label: string,
    value: FontFamily,
    onChange: (f: FontFamily) => void,
    options: { id: FontFamily, label: string, style: string }[]
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.id === value);

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">
                {label}
            </label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-left transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
            >
                <div className="flex items-center gap-3">
                    <span className={`text-lg leading-none ${selectedOption?.style}`}>Abc</span>
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        {selectedOption?.label}
                    </span>
                </div>
                <ChevronDown size={16} className={`text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden animate-fadeIn">
                    {options.map(option => (
                        <button
                            key={option.id}
                            onClick={() => {
                                onChange(option.id);
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-b last:border-0 border-zinc-100 dark:border-zinc-800"
                        >
                            <div className="flex items-center gap-3">
                                <span className={`text-lg leading-none ${option.style}`}>Abc</span>
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                                    {option.label}
                                </span>
                            </div>
                            {value === option.id && <Check size={16} className="text-indigo-600" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// Helper for Size Slider
function SizeSlider({
    label,
    value,
    onChange
}: {
    label: string,
    value: number,
    onChange: (val: number) => void
}) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    {label}
                </label>
                <span className="text-xs font-medium text-indigo-600 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 rounded">
                    {Math.round(value * 100)}%
                </span>
            </div>
            <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <Type size={14} className="text-zinc-400" />
                <input
                    type="range"
                    min="0.7"
                    max="1.5"
                    step="0.05"
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="flex-1 accent-indigo-600 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                />
                <Type size={20} className="text-zinc-600 dark:text-zinc-200" />
            </div>
        </div>
    );
}


export default function DesignTab() {
    const { settings, updateSettings } = useDesign();

    const themes: { id: Theme; label: string; icon: any }[] = [
        { id: "light", label: "Hell", icon: Sun },
        { id: "dark", label: "Dunkel", icon: Moon },
        { id: "system", label: "System", icon: Monitor },
    ];

    const fontOptions: { id: FontFamily; label: string; style: string }[] = [
        { id: "montserrat", label: "Montserrat", style: "font-sans" },
        { id: "outfit", label: "Outfit", style: "font-[family-name:var(--font-outfit)]" },
        { id: "inter", label: "Inter", style: "font-[family-name:var(--font-inter)]" },
        { id: "serif", label: "Playfair Display", style: "font-serif" },
    ];

    return (
        <div className="space-y-8 animate-fadeIn max-w-lg mx-auto pb-10">

            {/* Theme */}
            <section className="bg-zinc-50 dark:bg-zinc-900/30 p-5 rounded-2xl space-y-4">
                <h3 className="flex items-center gap-2">
                    <Palette size={20} className="text-pink-500" />
                    Allgemein
                </h3>
                <div className="grid grid-cols-3 gap-2 bg-zinc-200/50 dark:bg-zinc-800 p-1 rounded-xl">
                    {themes.map(t => {
                        const Icon = t.icon;
                        const isActive = settings.theme === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => updateSettings({ theme: t.id })}
                                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                    ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                    }`}
                            >
                                <Icon size={16} />
                                {t.label}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Headings */}
            <section className="bg-zinc-50 dark:bg-zinc-900/30 p-5 rounded-2xl space-y-6">
                <h3 className="font-heading">Überschriften</h3>

                <FontDropdown
                    label="Schriftart"
                    value={settings.fontFamilyHeadings}
                    onChange={(id) => updateSettings({ fontFamilyHeadings: id })}
                    options={fontOptions}
                />

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Stil</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => updateSettings({ headingStyle: { ...settings.headingStyle, bold: !settings.headingStyle.bold } })}
                            className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-all ${settings.headingStyle.bold
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                                }`}
                        >
                            <Bold size={18} />
                        </button>
                        <button
                            onClick={() => updateSettings({ headingStyle: { ...settings.headingStyle, italic: !settings.headingStyle.italic } })}
                            className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-all ${settings.headingStyle.italic
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                                }`}
                        >
                            <Italic size={18} />
                        </button>
                        <button
                            onClick={() => updateSettings({ headingStyle: { ...settings.headingStyle, underline: !settings.headingStyle.underline } })}
                            className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-all ${settings.headingStyle.underline
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                                }`}
                        >
                            <Underline size={18} />
                        </button>
                    </div>
                </div>

                <SizeSlider
                    label="Größe"
                    value={settings.fontSizeScaleHeadings}
                    onChange={(v) => updateSettings({ fontSizeScaleHeadings: v })}
                />

                {/* Preview Box for Headings */}
                <div className="mt-4 p-6 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <div style={{ fontFamily: `var(--font-headings)` }}>
                        <h4
                            className="font-bold text-zinc-900 dark:text-white mb-2 transition-all duration-200"
                            style={{
                                fontWeight: settings.headingStyle.bold ? 700 : 300,
                                fontStyle: settings.headingStyle.italic ? 'italic' : 'normal',
                                textDecoration: settings.headingStyle.underline ? 'underline' : 'none',
                                fontSize: `calc(1.5rem * ${settings.fontSizeScaleHeadings})`, // mimicking text-2xl
                                lineHeight: 1.2
                            }}
                        >
                            Überschrift Vorschau
                        </h4>
                        <p
                            className="text-zinc-500 dark:text-zinc-400"
                            style={{ fontSize: `calc(1rem * ${settings.fontSizeScaleDetails})` }}
                        >
                            Unterzeile zur Kontrolle
                        </p>
                    </div>
                </div>
            </section>

            {/* Standard Text */}
            <section className="bg-zinc-50 dark:bg-zinc-900/30 p-5 rounded-2xl space-y-6">
                <h3>Standardtext</h3>

                <FontDropdown
                    label="Schriftart"
                    value={settings.fontFamilyDetails}
                    onChange={(id) => updateSettings({ fontFamilyDetails: id })}
                    options={fontOptions}
                />

                <SizeSlider
                    label="Größe"
                    value={settings.fontSizeScaleDetails}
                    onChange={(v) => updateSettings({ fontSizeScaleDetails: v })}
                />

                {/* Preview Box for Standard Text */}
                <div className="mt-4 p-6 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <p
                        className="text-zinc-800 dark:text-zinc-200 leading-relaxed transition-all duration-200"
                        style={{
                            fontFamily: `var(--font-details)`,
                            fontSize: `calc(1rem * ${settings.fontSizeScaleDetails})`
                        }}
                    >
                        Dies ist ein Beispiel für den Standardtext in der App. Er sollte gut lesbar sein und sich harmonisch in das Gesamtbild einfügen.
                    </p>
                </div>
            </section>

            {/* Bible Text */}
            <section className="bg-zinc-50 dark:bg-zinc-900/30 p-5 rounded-2xl space-y-6 border-l-4 border-indigo-500">
                <h3 className="flex items-center gap-2">
                    <span className="font-serif italic">📖</span>
                    Bibeltext
                </h3>

                <FontDropdown
                    label="Schriftart"
                    value={settings.fontFamilyBible}
                    onChange={(id) => updateSettings({ fontFamilyBible: id })}
                    options={fontOptions}
                />

                <SizeSlider
                    label="Größe"
                    value={settings.fontSizeScaleBible}
                    onChange={(v) => updateSettings({ fontSizeScaleBible: v })}
                />

                <div className="mt-4 p-4 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <p
                        className="text-zinc-800 dark:text-zinc-200 transition-all duration-200"
                        style={{
                            fontFamily: `var(--font-bible)`,
                            fontSize: `calc(1.125rem * ${settings.fontSizeScaleBible})`,
                            lineHeight: 1.8
                        }}
                    >
                        Im Anfang war das Wort, und das Wort war bei Gott, und Gott war das Wort.
                    </p>
                </div>
            </section>

        </div>
    );
}
