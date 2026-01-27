import { Ruler, Scale, Droplets, Coins, Calculator, LucideIcon } from "lucide-react";

// Type definitions for ancient measures
export interface Unit {
    name: string;
    factor: number;
    unit: string;
    description: string;
    biblical: string;
    plural?: string[]; // Optional array of plural forms or alternative spellings
    purchasingPower?: number; // Estimated value in Euro (for currency)
}

export interface CategoryData {
    name: string;
    icon: LucideIcon;
    color: string;
    units: Record<string, Unit>;
}

// Ancient measures with conversion factors to modern units
// Including plural forms for detection in text
export const ANCIENT_MEASURES: Record<string, CategoryData> = {
    length: {
        name: "Längenmaße",
        icon: Ruler,
        color: "indigo",
        units: {
            stadion: {
                name: "Stadion (στάδιον)",
                factor: 0.185,
                unit: "km",
                description: "Griechisches Längenmaß, ca. 185m. 600 griechische Fuß. Ursprünglich die Länge der Rennbahn in Olympia.",
                biblical: "Johannes 6:19; Lukas 24:13; Offenbarung 14:20; 21:16",
                plural: ["Stadien", "Stadions"]
            },
            elle_hebr: {
                name: "Elle (אַמָּה Ammah)",
                factor: 44.5,
                unit: "cm",
                description: "Hebräische Elle, ca. 44,5cm. Maß vom Ellbogen bis zur Fingerspitze. Grundmaß für den Tempelbau.",
                biblical: "1. Mose 6:15; 2. Mose 25:10; 1. Könige 6:2",
                plural: ["Ellen"]
            },
            elle_lang: {
                name: "Große Elle (königlich)",
                factor: 52.5,
                unit: "cm",
                description: "Königliche oder große Elle, ca. 52,5cm. Verwendet bei besonderen Bauwerken.",
                biblical: "Hesekiel 40:5; 43:13",
                plural: ["große Ellen", "königliche Ellen"]
            },
            spanne: {
                name: "Spanne (זֶרֶת Zeret)",
                factor: 22.25,
                unit: "cm",
                description: "Halbe Elle, ca. 22,25cm. Abstand zwischen ausgestrecktem Daumen und kleinem Finger.",
                biblical: "2. Mose 28:16; 1. Samuel 17:4",
                plural: ["Spannen"]
            },
            handbreit: {
                name: "Handbreite (טֶפַח Tefach)",
                factor: 7.4,
                unit: "cm",
                description: "Ca. 7,4cm. Breite der vier Finger ohne Daumen. 1/6 Elle.",
                biblical: "2. Mose 25:25; 1. Könige 7:26; Psalm 39:6",
                plural: ["Handbreiten", "Handbreit"]
            },
            finger: {
                name: "Fingerbreite (אֶצְבַּע Etzba)",
                factor: 1.85,
                unit: "cm",
                description: "Ca. 1,85cm. Kleinste hebräische Längeneinheit. 1/4 Handbreite.",
                biblical: "Jeremia 52:21",
                plural: ["Fingerbreiten", "Finger"]
            },
            rute: {
                name: "Rute/Rohr (קָנֶה Qaneh)",
                factor: 2.67,
                unit: "m",
                description: "Ca. 2,67m bzw. 6 Ellen. Messrute für Vermessungen.",
                biblical: "Hesekiel 40:5; 42:16-19",
                plural: ["Ruten", "Messrute", "Messruten"]
            },
            meile_rom: {
                name: "Römische Meile (mille passus)",
                factor: 1.48,
                unit: "km",
                description: "Ca. 1.480m. 1000 Doppelschritte. Standardmaß im Römischen Reich.",
                biblical: "Matthäus 5:41",
                plural: ["Meilen", "Meile"]
            },
            sabbatweg: {
                name: "Sabbatweg",
                factor: 880,
                unit: "m",
                description: "Ca. 880m (2000 Ellen). Maximale erlaubte Wegstrecke am Sabbat.",
                biblical: "Apostelgeschichte 1:12",
                plural: ["Sabbatwege"]
            },
            tagesreise: {
                name: "Tagesreise",
                factor: 30,
                unit: "km",
                description: "Ca. 25-35km je nach Gelände. Typische Fußreise eines Tages.",
                biblical: "1. Mose 30:36; 4. Mose 11:31; Lukas 2:44",
                plural: ["Tagesreisen"]
            }
        }
    },
    weight: {
        name: "Gewichte",
        icon: Scale,
        color: "amber",
        units: {
            talent: {
                name: "Talent (כִּכָּר Kikkar)",
                factor: 34.2,
                unit: "kg",
                description: "Ca. 34,2kg. Größte Gewichtseinheit. 60 Minen oder 3000 Schekel.",
                biblical: "2. Mose 25:39; 2. Samuel 12:30; Matthäus 18:24; 25:15",
                plural: ["Talente", "Zentner"] // Luther übersetzt Talent oft mit Zentner
            },
            mine: {
                name: "Mine (מָנֶה Maneh)",
                factor: 571,
                unit: "g",
                description: "Ca. 571g. 50 Schekel. Handelsgewicht im Orient.",
                biblical: "1. Könige 10:17; Esra 2:69; Hesekiel 45:12",
                plural: ["Minen", "Pfund"] // Luther Pfund? oft Pfund für Mine oder Litra
            },
            schekel: {
                name: "Schekel (שֶׁקֶל Shekel)",
                factor: 11.4,
                unit: "g",
                description: "Ca. 11,4g. Grundgewicht und später Münze. Bedeutet 'abgewogen'.",
                biblical: "1. Mose 23:15-16; 2. Mose 30:13; Matthäus 17:27",
                plural: ["Silberlinge"] // Oft als Silberlinge übersetzt im NT
            },
            schekel_heiligtum: {
                name: "Schekel des Heiligtums",
                factor: 11.4,
                unit: "g",
                description: "Standardisierter Schekel für Tempelabgaben. Genaues Normgewicht.",
                biblical: "2. Mose 30:13; 3. Mose 5:15; 4. Mose 3:47",
                plural: []
            },
            beka: {
                name: "Beka (בֶּקַע)",
                factor: 5.7,
                unit: "g",
                description: "Ca. 5,7g. Halber Schekel. Kopfsteuer für den Tempel.",
                biblical: "1. Mose 24:22; 2. Mose 38:26",
                plural: ["Beka"]
            },
            gera: {
                name: "Gera (גֵּרָה)",
                factor: 0.57,
                unit: "g",
                description: "Ca. 0,57g. 1/20 Schekel. Kleinste Gewichtseinheit.",
                biblical: "2. Mose 30:13; 3. Mose 27:25; Hesekiel 45:12",
                plural: ["Gera"]
            },
            pfund_rom: {
                name: "Römisches Pfund (Litra)",
                factor: 327,
                unit: "g",
                description: "Ca. 327g. Römisches Standardgewicht.",
                biblical: "Johannes 12:3; 19:39",
                plural: ["Pfund"]
            }
        }
    },
    volume: {
        name: "Hohlmaße",
        icon: Droplets,
        color: "cyan",
        units: {
            homer: {
                name: "Homer/Kor (חֹמֶר)",
                factor: 220,
                unit: "L",
                description: "Ca. 220 Liter. Größtes Hohlmaß. 'Eselslast'. 10 Epha.",
                biblical: "3. Mose 27:16; Jesaja 5:10; Hesekiel 45:11",
                plural: ["Kor"]
            },
            letech: {
                name: "Letech (לֶתֶךְ)",
                factor: 110,
                unit: "L",
                description: "Ca. 110 Liter. Halber Homer.",
                biblical: "Hosea 3:2",
                plural: []
            },
            epha: {
                name: "Epha (אֵיפָה)",
                factor: 22,
                unit: "L",
                description: "Ca. 22 Liter. Hauptmaß für trockene Güter (Getreide, Mehl).",
                biblical: "2. Mose 16:36; Ruth 2:17; Hesekiel 45:10-11",
                plural: ["Scheffel"] // Luther übersetzt oft Scheffel
            },
            sea: {
                name: "Sea (סְאָה)",
                factor: 7.3,
                unit: "L",
                description: "Ca. 7,3 Liter. 1/3 Epha. Maß für Mehl.",
                biblical: "1. Mose 18:6; 1. Samuel 25:18; 2. Könige 7:1",
                plural: ["Maß"]
            },
            omer: {
                name: "Omer (עֹמֶר)",
                factor: 2.2,
                unit: "L",
                description: "Ca. 2,2 Liter. 1/10 Epha. Tagesration Manna.",
                biblical: "2. Mose 16:16-36",
                plural: ["Krug", "Krüge"] // Oft Krug Manna
            },
            kab: {
                name: "Kab (קַב)",
                factor: 1.2,
                unit: "L",
                description: "Ca. 1,2 Liter. 1/18 Epha.",
                biblical: "2. Könige 6:25",
                plural: ["Kabin"]
            },
            bat: {
                name: "Bat (בַּת)",
                factor: 22,
                unit: "L",
                description: "Ca. 22 Liter. Hauptmaß für Flüssigkeiten. Entspricht dem Epha.",
                biblical: "1. Könige 7:26; 2. Chronik 2:9; Hesekiel 45:10-11",
                plural: ["Eimer"] // Luther
            },
            hin: {
                name: "Hin (הִין)",
                factor: 3.7,
                unit: "L",
                description: "Ca. 3,7 Liter. 1/6 Bat. Für Öl und Wein.",
                biblical: "2. Mose 29:40; 3. Mose 19:36; Hesekiel 4:11",
                plural: ["Kannen"]
            },
            log: {
                name: "Log (לֹג)",
                factor: 0.31,
                unit: "L",
                description: "Ca. 0,31 Liter. 1/12 Hin. Kleinstes Flüssigkeitsmaß.",
                biblical: "3. Mose 14:10-24",
                plural: []
            },
            metretes: {
                name: "Metretes (μετρητής)",
                factor: 39,
                unit: "L",
                description: "Ca. 39 Liter. Griechisches Maß für Flüssigkeiten.",
                biblical: "Johannes 2:6",
                plural: ["Maß", "Krüge"]
            }
        }
    },
    money: {
        name: "Geld & Währung",
        icon: Coins,
        color: "emerald",
        units: {
            talent_silber: {
                name: "Talent Silber",
                factor: 6000,
                unit: "Denare",
                description: "6000 Denare oder ca. 20 Jahresgehälter eines Arbeiters. Riesige Summe.",
                biblical: "Matthäus 18:24; 25:14-30",
                plural: ["Talente"],
                purchasingPower: 600000 // 6000 * 100
            },
            mine_silber: {
                name: "Mine Silber (μνᾶ)",
                factor: 100,
                unit: "Denare",
                description: "100 Denare. Ca. 3-4 Monatsgehälter eines Arbeiters.",
                biblical: "Lukas 19:13-25",
                plural: ["Minen", "Pfund"],
                purchasingPower: 10000 // 100 * 100
            },
            stater: {
                name: "Stater (στατήρ)",
                factor: 4,
                unit: "Denare",
                description: "Griechische Silbermünze. 4 Drachmen = 4 Denare. Entsprach dem Schekel.",
                biblical: "Matthäus 17:27",
                plural: ["Stater"],
                purchasingPower: 400
            },
            drachme: {
                name: "Drachme (δραχμή)",
                factor: 1,
                unit: "Denar",
                description: "Griechische Silbermünze. Entsprach ungefähr dem römischen Denar.",
                biblical: "Lukas 15:8-9",
                plural: ["Drachmen", "Groschen"],
                purchasingPower: 100
            },
            denar: {
                name: "Denar (δηνάριον)",
                factor: 1,
                unit: "Tagelohn",
                description: "Römische Silbermünze. Ein Tageslohn eines Arbeiters.",
                biblical: "Matthäus 20:2-13; 22:19; Markus 12:15",
                plural: ["Denare", "Groschen", "Silberlinge"],
                purchasingPower: 100 // Tagelohn Mindestlohn
            },
            as: {
                name: "As (ἀσσάριον)",
                factor: 0.0625,
                unit: "Denar",
                description: "1/16 Denar. Kleine römische Kupfermünze.",
                biblical: "Matthäus 10:29; Lukas 12:6",
                plural: ["Ass"],
                purchasingPower: 6
            },
            quadrans: {
                name: "Quadrans (κοδράντης)",
                factor: 0.015625,
                unit: "Denar",
                description: "1/64 Denar. Kleinste römische Münze. 'Der letzte Heller'.",
                biblical: "Matthäus 5:26; Markus 12:42",
                plural: ["Heller"],
                purchasingPower: 1.5
            },
            lepton: {
                name: "Lepton (λεπτόν)",
                factor: 0.0078125,
                unit: "Denar",
                description: "1/128 Denar. Kleinste jüdische Münze. 'Scherflein der Witwe'.",
                biblical: "Markus 12:42; Lukas 21:2",
                plural: ["Scherflein"],
                purchasingPower: 0.8
            },
            schekel_silber: {
                name: "Schekel Silber",
                factor: 4,
                unit: "Denare",
                description: "Hebräische Silbermünze. 4 Denare. Später gleich dem Stater.",
                biblical: "Matthäus 26:15; 27:3-9",
                plural: ["Silberlinge"],
                purchasingPower: 400
            }
        }
    }
};

/**
 * Finds a measure unit in a given text string.
 * Checks against unit names and plural/alternative forms.
 * Returns the Unit object if found, otherwise null.
 */
export function findMeasure(word: string): { unit: Unit, originalWord: string } | null {
    // Remove punctuation
    const cleanWord = word.replace(/[.,;!?()":]/g, "").trim();
    if (!cleanWord) return null;

    for (const category of Object.values(ANCIENT_MEASURES)) {
        for (const unit of Object.values(category.units)) {
            // Check primary name (first word of name, e.g. "Elle" from "Elle (Ammah)")
            const primaryName = unit.name.split(" ")[0];

            if (cleanWord === primaryName) {
                return { unit, originalWord: cleanWord };
            }

            // Check plurals
            if (unit.plural && unit.plural.includes(cleanWord)) {
                return { unit, originalWord: cleanWord };
            }
        }
    }
    return null;
}

/**
 * Tries to parse a number from a string, handling digits and common German number words.
 */
export function parseGermanNumber(word: string): number | null {
    if (!word) return null;
    const clean = word.toLowerCase().replace(/[.,;!?]/g, "");

    // Check digits
    const digitMatch = clean.match(/^(\d+(?:[.,]\d+)?)$/); // Allow 1000, 3,5, 3.5
    if (digitMatch) {
        return parseFloat(digitMatch[1].replace(',', '.'));
    }

    // Common number words mapping
    const numberWords: Record<string, number> = {
        "ein": 1, "eine": 1, "einer": 1, "eines": 1,
        "zwei": 2, "beide": 2,
        "drei": 3,
        "vier": 4,
        "fünf": 5,
        "sechs": 6,
        "sieben": 7,
        "acht": 8,
        "neun": 9,
        "zehn": 10,
        "elf": 11,
        "zwölf": 12,
        "zwanzig": 20,
        "dreißig": 30,
        "vierzig": 40,
        "fünfzig": 50,
        "sechzig": 60,
        "siebzig": 70,
        "achtzig": 80,
        "neunzig": 90,
        "hundert": 100,
        "einhundert": 100,
        "zweihundert": 200,
        "dreihundert": 300,
        "vierhundert": 400,
        "fünfhundert": 500,
        "tausend": 1000,
        "eintausend": 1000,
        "zweitausend": 2000,
        "dreitausend": 3000,
        "fünftausend": 5000,
        "zehntausend": 10000
    };

    if (numberWords[clean]) {
        return numberWords[clean];
    }

    return null;
}

/**
 * Formats a value with the best suitable unit (e.g. cm -> m -> km).
 */
export function formatBestUnit(value: number, currentUnit: string): string {
    // Length
    if (currentUnit === 'cm') {
        if (value >= 100000) return `${(value / 100000).toLocaleString('de-DE', { maximumFractionDigits: 2 })} km`;
        if (value >= 100) return `${(value / 100).toLocaleString('de-DE', { maximumFractionDigits: 2 })} m`;
        return `${value.toLocaleString('de-DE', { maximumFractionDigits: 2 })} cm`;
    }
    if (currentUnit === 'm') {
        if (value >= 1000) return `${(value / 1000).toLocaleString('de-DE', { maximumFractionDigits: 2 })} km`;
        return `${value.toLocaleString('de-DE', { maximumFractionDigits: 2 })} m`;
    }

    // Weight
    if (currentUnit === 'g') {
        if (value >= 1000000) return `${(value / 1000000).toLocaleString('de-DE', { maximumFractionDigits: 2 })} t`;
        if (value >= 1000) return `${(value / 1000).toLocaleString('de-DE', { maximumFractionDigits: 2 })} kg`;
        return `${value.toLocaleString('de-DE', { maximumFractionDigits: 2 })} g`;
    }
    if (currentUnit === 'kg') {
        if (value >= 1000) return `${(value / 1000).toLocaleString('de-DE', { maximumFractionDigits: 2 })} t`;
        return `${value.toLocaleString('de-DE', { maximumFractionDigits: 2 })} kg`;
    }

    // Volume
    if (currentUnit === 'L' || currentUnit === 'l') {
        if (value >= 1000) return `${(value / 1000).toLocaleString('de-DE', { maximumFractionDigits: 2 })} m³`;
        return `${value.toLocaleString('de-DE', { maximumFractionDigits: 2 })} L`;
    }

    // Default
    return `${value.toLocaleString('de-DE', { maximumFractionDigits: 2 })} ${currentUnit}`;
}
