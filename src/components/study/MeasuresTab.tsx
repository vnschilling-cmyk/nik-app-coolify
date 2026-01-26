"use client";

import { useState } from "react";
import { Ruler, Scale, Droplets, Coins, Calculator, Info, ChevronDown, ChevronRight, LucideIcon } from "lucide-react";

import { ANCIENT_MEASURES } from "@/lib/measures";

type Category = keyof typeof ANCIENT_MEASURES;

export default function MeasuresTab() {
    const [activeCategory, setActiveCategory] = useState<Category>("length");
    const [inputValue, setInputValue] = useState<string>("");
    const [selectedUnit, setSelectedUnit] = useState<string>("");
    const [expandedInfo, setExpandedInfo] = useState<Set<string>>(new Set());

    const category = ANCIENT_MEASURES[activeCategory];
    const units = category.units;

    // Set default unit when category changes
    const handleCategoryChange = (cat: Category) => {
        setActiveCategory(cat);
        setSelectedUnit(Object.keys(ANCIENT_MEASURES[cat].units)[0]);
        setInputValue("");
    };

    // Initialize selected unit
    if (!selectedUnit && Object.keys(units).length > 0) {
        setSelectedUnit(Object.keys(units)[0]);
    }

    const currentUnit = selectedUnit ? units[selectedUnit as keyof typeof units] : null;

    const calculateResult = () => {
        if (!inputValue || !currentUnit) return null;
        const value = parseFloat(inputValue);
        if (isNaN(value)) return null;
        const result = value * currentUnit.factor;
        return result;
    };

    const result = calculateResult();

    const toggleInfo = (unitKey: string) => {
        const newSet = new Set(expandedInfo);
        if (newSet.has(unitKey)) {
            newSet.delete(unitKey);
        } else {
            newSet.add(unitKey);
        }
        setExpandedInfo(newSet);
    };

    // Color mapping for categories
    const colorClasses = {
        indigo: {
            bg: "bg-indigo-100 dark:bg-indigo-900/40",
            text: "text-indigo-700 dark:text-indigo-300",
            border: "border-indigo-500",
            button: "bg-indigo-600 hover:bg-indigo-700",
            gradient: "from-indigo-500 to-purple-600",
            ring: "ring-indigo-500"
        },
        amber: {
            bg: "bg-amber-100 dark:bg-amber-900/40",
            text: "text-amber-700 dark:text-amber-300",
            border: "border-amber-500",
            button: "bg-amber-600 hover:bg-amber-700",
            gradient: "from-amber-400 to-orange-500",
            ring: "ring-amber-500"
        },
        cyan: {
            bg: "bg-cyan-100 dark:bg-cyan-900/40",
            text: "text-cyan-700 dark:text-cyan-300",
            border: "border-cyan-500",
            button: "bg-cyan-600 hover:bg-cyan-700",
            gradient: "from-cyan-500 to-teal-600",
            ring: "ring-cyan-500"
        },
        emerald: {
            bg: "bg-emerald-100 dark:bg-emerald-900/40",
            text: "text-emerald-700 dark:text-emerald-300",
            border: "border-emerald-500",
            button: "bg-emerald-600 hover:bg-emerald-700",
            gradient: "from-emerald-500 to-green-600",
            ring: "ring-emerald-500"
        }
    };

    const colors = colorClasses[category.color as keyof typeof colorClasses];

    return (
        <div className="space-y-6">
            {/* Category Tiles Grid */}
            <div className="grid grid-cols-2 gap-3">
                {(Object.keys(ANCIENT_MEASURES) as Category[]).map(catKey => {
                    const cat = ANCIENT_MEASURES[catKey];
                    const Icon = cat.icon;
                    const isActive = activeCategory === catKey;
                    const catColors = colorClasses[cat.color as keyof typeof colorClasses];
                    const unitCount = Object.keys(cat.units).length;

                    return (
                        <button
                            key={catKey}
                            onClick={() => handleCategoryChange(catKey)}
                            className={`relative group p-4 rounded-xl text-left transition-all duration-300 overflow-hidden ${isActive
                                ? `bg-white dark:bg-zinc-900 ring-2 ${catColors.ring} shadow-xl scale-[1.02]`
                                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-transparent hover:shadow-xl hover:scale-[1.02]"
                                }`}
                        >
                            {/* Gradient Background on Hover/Active */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${catColors.gradient} transition-opacity duration-300 ${isActive ? "opacity-5" : "opacity-0 group-hover:opacity-5"}`} />

                            {/* Icon */}
                            <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${catColors.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                                <Icon size={24} className="text-white" />
                            </div>

                            {/* Title */}
                            <h3 className="relative font-bold text-zinc-900 dark:text-white mb-1">
                                {cat.name}
                            </h3>

                            {/* Unit Count */}
                            <p className="relative text-xs text-zinc-500 dark:text-zinc-400">
                                {unitCount} Einheiten
                            </p>

                            {/* Active Indicator */}
                            {isActive && (
                                <div className={`absolute top-3 right-3 w-2 h-2 rounded-full bg-${cat.color}-500`} />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Calculator Card */}
            <div className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-6`}>
                <div className="flex items-center gap-3 mb-6">
                    <div className={`w-12 h-12 rounded-xl ${colors.button} flex items-center justify-center`}>
                        <Calculator className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Umrechner</h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{category.name} umrechnen</p>
                    </div>
                </div>

                <div className="grid gap-4">
                    {/* Input Row */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="number"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Wert eingeben..."
                            className="flex-1 px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                        <select
                            value={selectedUnit}
                            onChange={(e) => setSelectedUnit(e.target.value)}
                            className="px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500 focus:border-transparent transition-all min-w-[180px]"
                        >
                            {Object.entries(units).map(([key, unit]) => (
                                <option key={key} value={key}>{unit.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Result */}
                    {result !== null && currentUnit && (
                        <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                            <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Ergebnis:</div>
                            <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                                {inputValue} {selectedUnit && units[selectedUnit as keyof typeof units]?.name.split(" ")[0]} = <span className={colors.text}>{result.toLocaleString('de-DE', { maximumFractionDigits: 4 })} {currentUnit.unit}</span>
                            </div>
                        </div>
                    )}

                    {/* Current Unit Info */}
                    {currentUnit && (
                        <div className="bg-white/50 dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                            <div className="flex items-start gap-3">
                                <Info className={`w-5 h-5 mt-0.5 ${colors.text}`} />
                                <div>
                                    <div className="font-medium text-zinc-900 dark:text-white">{currentUnit.name}</div>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{currentUnit.description}</p>
                                    {currentUnit.biblical && (
                                        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2 italic">
                                            📖 {currentUnit.biblical}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Reference Table */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
                    <h3 className="font-bold text-zinc-900 dark:text-white">📚 Übersicht: {category.name}</h3>
                </div>
                <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {Object.entries(units).map(([key, unit]) => {
                        const isExpanded = expandedInfo.has(key);
                        return (
                            <div key={key} className="bg-white dark:bg-zinc-900">
                                <button
                                    onClick={() => toggleInfo(key)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                                >
                                    <div className="flex-1">
                                        <div className="font-medium text-zinc-900 dark:text-white">{unit.name}</div>
                                        <div className="text-sm text-zinc-500">
                                            1 = {unit.factor.toLocaleString('de-DE', { maximumFractionDigits: 4 })} {unit.unit}
                                        </div>
                                    </div>
                                    {isExpanded ? (
                                        <ChevronDown className="w-5 h-5 text-zinc-400" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-zinc-400" />
                                    )}
                                </button>
                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-0">
                                        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 text-sm">
                                            <p className="text-zinc-700 dark:text-zinc-300">{unit.description}</p>
                                            {unit.biblical && (
                                                <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-xs italic">
                                                    📖 Bibelstellen: {unit.biblical}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
