"use client";

import { useDesign, Theme, FontFamily } from "@/context/DesignContext";
import { Moon, Sun, Monitor, Type, Bold, Italic, Underline, Check, ChevronDown, Palette } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import clsx from "clsx";

// Helper Component for Dropdown - More Compact
function FontDropdown({
    value,
    onChange,
    options
}: {
    value: FontFamily,
    onChange: (f: FontFamily) => void,
    options: { id: FontFamily, label: string, variable: string }[]
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
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-white dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg px-3 py-2 text-left transition-all hover:border-zinc-300 dark:hover:border-zinc-500 shadow-sm"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-base font-medium truncate" style={{ fontFamily: selectedOption?.variable }}>
                        {selectedOption?.label}
                    </span>
                </div>
                <ChevronDown size={14} className={`text-zinc-400 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-fadeIn max-h-[250px] overflow-y-auto">
                    {options.map(option => (
                        <button
                            key={option.id}
                            onClick={() => {
                                onChange(option.id);
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-slate-700/50 transition-colors border-b last:border-0 border-zinc-100 dark:border-slate-700 mx-0"
                        >
                            <span className="text-sm" style={{ fontFamily: option.variable }}>
                                {option.label}
                            </span>
                            {value === option.id && <Check size={14} className="text-indigo-600" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// Helper for Size Slider - Compact
function SizeSlider({
    value,
    onChange
}: {
    value: number,
    onChange: (val: number) => void
}) {
    return (
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700 shadow-sm">
            <Type size={14} className="text-zinc-400" />
            <input
                type="range"
                min="0.7"
                max="1.5"
                step="0.05"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="flex-1 accent-indigo-600 h-1.5 bg-zinc-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs font-medium text-zinc-500 w-10 text-right">
                {Math.round(value * 100)}%
            </span>
        </div>
    );
}


export default function DesignTab() {
    const { settings, updateSettings } = useDesign();
    const [tempSettings, setTempSettings] = useState(settings);
    const [hasChanges, setHasChanges] = useState(false);
    const [activeSection, setActiveSection] = useState<'headings' | 'body' | 'bible'>('headings');

    useEffect(() => {
        if (!hasChanges) {
            setTempSettings(settings);
        }
    }, [settings, hasChanges]);

    const handleUpdate = (updates: Partial<typeof settings>) => {
        setTempSettings(prev => ({ ...prev, ...updates }));
        setHasChanges(true);
    };

    const handleSave = () => {
        updateSettings(tempSettings);
        setHasChanges(false);
    };

    const handleReset = () => {
        setTempSettings(settings);
        setHasChanges(false);
    };

    const themes: { id: Theme; label: string; icon: any }[] = [
        { id: "light", label: "Hell", icon: Sun },
        { id: "dark", label: "Dunkel", icon: Moon },
        { id: "system", label: "Auto", icon: Monitor },
    ];

    const fontOptions: { id: FontFamily; label: string; variable: string }[] = [
        { id: "montserrat", label: "Montserrat", variable: "var(--font-montserrat)" },
        { id: "raleway", label: "Raleway", variable: "var(--font-raleway)" },
        { id: "ubuntu", label: "Ubuntu", variable: "var(--font-ubuntu)" },
        { id: "quicksand", label: "Quicksand", variable: "var(--font-quicksand)" },
        { id: "smooch_sans", label: "Smooch Sans", variable: "var(--font-smooch-sans)" },
        { id: "dancing_script", label: "Dancing Script", variable: "var(--font-dancing-script)" },
        { id: "lobster_two", label: "Lobster Two", variable: "var(--font-lobster-two)" },
        { id: "exo_2", label: "Exo 2", variable: "var(--font-exo-2)" },
        { id: "comfortaa", label: "Comfortaa", variable: "var(--font-comfortaa)" },
        { id: "play", label: "Play", variable: "var(--font-play)" },
        { id: "satisfy", label: "Satisfy", variable: "var(--font-satisfy)" },
    ];

    return (
        <div className="space-y-6 animate-fadeIn max-w-lg mx-auto pb-24 relative">

            {/* Compact Theme Switcher */}
            <div className="bg-zinc-100 dark:bg-slate-800/50 p-1.5 rounded-xl flex gap-1">
                {themes.map(t => {
                    const Icon = t.icon;
                    const isSelected = settings.theme === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => updateSettings({ theme: t.id })}
                            className={clsx(
                                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                                isSelected
                                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            )}
                        >
                            <Icon size={16} />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {/* Typography Section with Tabs */}
            <section className="bg-white dark:bg-slate-800/30 border border-zinc-200 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">

                {/* Tabs */}
                <div className="flex border-b border-zinc-100 dark:border-slate-700/50">
                    {[
                        { id: 'headings', label: 'Titel' },
                        { id: 'body', label: 'Text' },
                        { id: 'bible', label: 'Bibel' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSection(tab.id as any)}
                            className={clsx(
                                "flex-1 py-3 text-sm font-medium transition-colors relative",
                                activeSection === tab.id
                                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10"
                                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            )}
                        >
                            {tab.label}
                            {activeSection === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-5 space-y-5">

                    {/* Headings Controls */}
                    {activeSection === 'headings' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="grid grid-cols-2 gap-3 items-end">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Schriftart</label>
                                    <FontDropdown
                                        value={tempSettings.fontFamilyHeadings}
                                        onChange={(id) => handleUpdate({ fontFamilyHeadings: id })}
                                        options={fontOptions}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Größe</label>
                                    <SizeSlider
                                        value={tempSettings.fontSizeScaleHeadings}
                                        onChange={(v) => handleUpdate({ fontSizeScaleHeadings: v })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Stil</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleUpdate({ headingStyle: { ...tempSettings.headingStyle, light: !tempSettings.headingStyle.light, bold: false } })}
                                        className={clsx(
                                            "flex-1 h-9 rounded-lg border text-sm transition-all",
                                            tempSettings.headingStyle.light
                                                ? "bg-indigo-600 border-indigo-600 text-white"
                                                : "bg-white dark:bg-slate-700 border-zinc-200 dark:border-slate-600 text-zinc-600 dark:text-zinc-400"
                                        )}
                                    >
                                        Thin
                                    </button>
                                    <button
                                        onClick={() => handleUpdate({ headingStyle: { ...tempSettings.headingStyle, bold: !tempSettings.headingStyle.bold, light: false } })}
                                        className={clsx(
                                            "w-10 h-9 flex items-center justify-center rounded-lg border transition-all",
                                            tempSettings.headingStyle.bold
                                                ? "bg-indigo-600 border-indigo-600 text-white"
                                                : "bg-white dark:bg-slate-700 border-zinc-200 dark:border-slate-600 text-zinc-600 dark:text-zinc-400"
                                        )}
                                    >
                                        <Bold size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleUpdate({ headingStyle: { ...tempSettings.headingStyle, italic: !tempSettings.headingStyle.italic } })}
                                        className={clsx(
                                            "w-10 h-9 flex items-center justify-center rounded-lg border transition-all",
                                            tempSettings.headingStyle.italic
                                                ? "bg-indigo-600 border-indigo-600 text-white"
                                                : "bg-white dark:bg-slate-700 border-zinc-200 dark:border-slate-600 text-zinc-600 dark:text-zinc-400"
                                        )}
                                    >
                                        <Italic size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleUpdate({ headingStyle: { ...tempSettings.headingStyle, underline: !tempSettings.headingStyle.underline } })}
                                        className={clsx(
                                            "w-10 h-9 flex items-center justify-center rounded-lg border transition-all",
                                            tempSettings.headingStyle.underline
                                                ? "bg-indigo-600 border-indigo-600 text-white"
                                                : "bg-white dark:bg-slate-700 border-zinc-200 dark:border-slate-600 text-zinc-600 dark:text-zinc-400"
                                        )}
                                    >
                                        <Underline size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Headings Preview */}
                            <div className="mt-6 pt-6 border-t border-dashed border-zinc-200 dark:border-slate-700">
                                <div
                                    className="text-center"
                                    style={{ fontFamily: fontOptions.find(o => o.id === tempSettings.fontFamilyHeadings)?.variable || 'sans-serif' }}
                                >
                                    <div
                                        className="text-zinc-900 dark:text-white mb-1 transition-all duration-200"
                                        style={{
                                            fontWeight: tempSettings.headingStyle.light ? 100 : (tempSettings.headingStyle.bold ? 700 : 400),
                                            fontStyle: tempSettings.headingStyle.italic ? 'italic' : 'normal',
                                            textDecoration: tempSettings.headingStyle.underline ? 'underline' : 'none',
                                            fontSize: `calc(1.5rem * ${tempSettings.fontSizeScaleHeadings})`,
                                            lineHeight: 1.2
                                        }}
                                    >
                                        Überschrift
                                    </div>
                                    <div className="text-zinc-400 text-xs uppercase tracking-wide">Vorschau</div>
                                </div>
                            </div>
                        </div>
                    )}



                    {/* Body Controls */}
                    {activeSection === 'body' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-2 gap-3 items-end">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Schriftart</label>
                                    <FontDropdown
                                        value={tempSettings.fontFamilyDetails}
                                        onChange={(id) => handleUpdate({ fontFamilyDetails: id })}
                                        options={fontOptions}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Größe</label>
                                    <SizeSlider
                                        value={tempSettings.fontSizeScaleDetails}
                                        onChange={(v) => handleUpdate({ fontSizeScaleDetails: v })}
                                    />
                                </div>
                            </div>

                            {/* Body Preview */}
                            <div className="mt-4 p-4 bg-zinc-50 dark:bg-slate-900/50 rounded-xl border border-zinc-100 dark:border-slate-800">
                                <p
                                    className="text-zinc-700 dark:text-zinc-300 leading-relaxed transition-all duration-200"
                                    style={{
                                        fontFamily: fontOptions.find(o => o.id === tempSettings.fontFamilyDetails)?.variable || 'sans-serif',
                                        fontSize: `calc(1rem * ${tempSettings.fontSizeScaleDetails})`
                                    }}
                                >
                                    Das ist ein Beispieltext. Er zeigt, wie der Standardtext in der App aussieht.
                                </p>
                            </div>
                        </div>
                    )}


                    {/* Bible Controls */}
                    {activeSection === 'bible' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-2 gap-3 items-end">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Schriftart</label>
                                    <FontDropdown
                                        value={tempSettings.fontFamilyBible}
                                        onChange={(id) => handleUpdate({ fontFamilyBible: id })}
                                        options={fontOptions}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Größe</label>
                                    <SizeSlider
                                        value={tempSettings.fontSizeScaleBible}
                                        onChange={(v) => handleUpdate({ fontSizeScaleBible: v })}
                                    />
                                </div>
                            </div>

                            {/* Bible Preview */}
                            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
                                <p
                                    className="text-zinc-800 dark:text-zinc-200 transition-all duration-200"
                                    style={{
                                        fontFamily: fontOptions.find(o => o.id === tempSettings.fontFamilyBible)?.variable || 'serif',
                                        fontSize: `calc(1.125rem * ${tempSettings.fontSizeScaleBible})`,
                                        lineHeight: 1.8
                                    }}
                                >
                                    Im Anfang war das Wort, und das Wort war bei Gott, und Gott war das Wort.
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            </section>


            {/* Floating Save Button */}
            {hasChanges && (
                <div className="fixed bottom-24 left-4 right-4 z-50 animate-bounce-in">
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-2xl border border-zinc-200 dark:border-slate-700 flex items-center justify-between gap-3 max-w-sm mx-auto">
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 text-sm text-zinc-500 font-medium hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                        >
                            Verwerfen
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 bg-indigo-600 text-white text-sm font-bold py-2.5 rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 active:scale-[0.98] transition-all"
                        >
                            Speichern
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}
