
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_AI_API_KEY;

export async function POST(req: Request) {
    if (!API_KEY) {
        return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
    }

    try {
        const { bibleRef, facts = [], questions = [] } = await req.json();

        if (!bibleRef && facts.length === 0 && questions.length === 0) {
            return NextResponse.json({ error: "No content provided" }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        let contextStrings = [];
        if (bibleRef) contextStrings.push(`BIBELTEXT/REFERENZ: ${bibleRef}`);
        if (facts.length > 0) {
            contextStrings.push(`LEKTIONS-INFOS (FAKTEN):\n${facts.map((f: any) => `- ${f.title}: ${f.description}`).join('\n')}`);
        }
        if (questions.length > 0) {
            contextStrings.push(`FRAGEN ZUR LEKTION:\n${questions.map((q: any) => `- ${q.question}`).join('\n')}`);
        }

        const context = contextStrings.join('\n\n---\n\n');

        const prompt = `
            Du bist ein Experte für theologische Bildung. Erstelle eine kurze, einladende Kurzbeschreibung (Vorschau) für eine Bibellektion.

            KONTEXT DER LEKTION:
            ---
            ${context}
            ---

            ANFORDERUNGEN:
            1. LÄNGE: Exakt 2 bis 4 Sätze.
            2. SPRACHE: Verwende EINFACHE SPRACHE. Sei einladend, motivierend und klar.
            3. INHALT: Fasse zusammen, worum es in der Lektion geht, basierend auf den oben genannten Infos und Fragen.
            4. FORMAT: Gib NUR den reinen Text der Beschreibung zurück, ohne Anführungszeichen oder Einleitungen.

            Antworte NUR mit dem Beschreibungstext.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text().trim();

        return NextResponse.json({ summary: textResponse });

    } catch (error: any) {
        console.error("Summary generation failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
