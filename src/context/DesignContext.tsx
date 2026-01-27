"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
export type FontFamily = "montserrat" | "raleway" | "ubuntu" | "quicksand" | "smooch_sans" | "dancing_script" | "lobster_two" | "exo_2" | "comfortaa" | "play" | "satisfy" | "momo_signature";
export type HeadingStyle = {
    bold: boolean;
    light: boolean;
    italic: boolean;
    underline: boolean;
};

interface DesignSettings {
    theme: Theme;
    fontFamilyDetails: FontFamily;
    fontFamilyHeadings: FontFamily;
    fontFamilyBible: FontFamily;
    headingStyle: HeadingStyle;
    fontSizeScaleDetails: number;
    fontSizeScaleHeadings: number;
    fontSizeScaleBible: number;
}

interface DesignContextType {
    settings: DesignSettings;
    updateSettings: (newSettings: Partial<DesignSettings>) => void;
    currentFontVariableDetails: string;
    currentFontVariableHeadings: string;
    currentFontVariableBible: string;
}

const defaultSettings: DesignSettings = {
    theme: "system",
    fontFamilyDetails: "montserrat",
    fontFamilyHeadings: "montserrat",
    fontFamilyBible: "raleway",
    headingStyle: { bold: true, light: false, italic: false, underline: false },
    fontSizeScaleDetails: 1.0,
    fontSizeScaleHeadings: 1.0,
    fontSizeScaleBible: 1.0,
};

const DesignContext = createContext<DesignContextType | undefined>(undefined);

export function DesignProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<DesignSettings>(defaultSettings);
    const [mounted, setMounted] = useState(false);

    // Initialize from localStorage
    useEffect(() => {
        const stored = localStorage.getItem("design-settings");
        if (stored) {
            try {
                // Merge with defaults to handle new fields
                setSettings({ ...defaultSettings, ...JSON.parse(stored) });
            } catch (e) {
                console.error("Failed to parse design settings", e);
            }
        }
        setMounted(true);
    }, []);

    // Persist to localStorage
    useEffect(() => {
        if (mounted) {
            localStorage.setItem("design-settings", JSON.stringify(settings));
        }
    }, [settings, mounted]);

    // Apply Theme
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        if (settings.theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            root.classList.add(systemTheme);
        } else {
            root.classList.add(settings.theme);
        }
    }, [settings.theme]);

    // Apply Font Sizes
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty("--font-scale-details", settings.fontSizeScaleDetails.toString());
        root.style.setProperty("--font-scale-headings", settings.fontSizeScaleHeadings.toString());
        root.style.setProperty("--font-scale-bible", settings.fontSizeScaleBible.toString());
    }, [settings.fontSizeScaleDetails, settings.fontSizeScaleHeadings, settings.fontSizeScaleBible]);

    // Helper for Font Variable
    const getFontVariable = (family: FontFamily) => {
        switch (family) {
            case "montserrat": return "var(--font-montserrat)";
            case "raleway": return "var(--font-raleway)";
            case "ubuntu": return "var(--font-ubuntu)";
            case "quicksand": return "var(--font-quicksand)";
            case "smooch_sans": return "var(--font-smooch-sans)";
            case "dancing_script": return "var(--font-dancing-script)";
            case "lobster_two": return "var(--font-lobster-two)";
            case "exo_2": return "var(--font-exo-2)";
            case "comfortaa": return "var(--font-comfortaa)";
            case "play": return "var(--font-play)";
            case "satisfy": return "var(--font-satisfy)";
            default: return "var(--font-montserrat)";
        }
    };

    // Apply Fonts & Styles
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty("--font-details", getFontVariable(settings.fontFamilyDetails));
        root.style.setProperty("--font-headings", getFontVariable(settings.fontFamilyHeadings));
        root.style.setProperty("--font-bible", getFontVariable(settings.fontFamilyBible));

        let weight = "400";
        if (settings.headingStyle.bold) weight = "700";
        if (settings.headingStyle.light) weight = "200";

        root.style.setProperty("--heading-weight", weight);
        root.style.setProperty("--heading-style", settings.headingStyle.italic ? "italic" : "normal");
        root.style.setProperty("--heading-decoration", settings.headingStyle.underline ? "underline" : "none");

    }, [settings.fontFamilyDetails, settings.fontFamilyHeadings, settings.fontFamilyBible, settings.headingStyle]);


    const updateSettings = (newSettings: Partial<DesignSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    return (
        <DesignContext.Provider value={{
            settings,
            updateSettings,
            currentFontVariableDetails: getFontVariable(settings.fontFamilyDetails),
            currentFontVariableHeadings: getFontVariable(settings.fontFamilyHeadings),
            currentFontVariableBible: getFontVariable(settings.fontFamilyBible)
        }}>
            {children}
        </DesignContext.Provider>
    );
}

export function useDesign() {
    const context = useContext(DesignContext);
    if (!context) throw new Error("useDesign must be used within a DesignProvider");
    return context;
}
