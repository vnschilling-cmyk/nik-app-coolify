import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { THEOLOGICAL_CONSTRAINTS } from "@/lib/theology";

// Ensure API key is present
const API_KEY = process.env.GOOGLE_AI_API_KEY;

export async function POST(req: Request) {
    if (!API_KEY) {
        return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
    }

    try {
        const { text, count = 5, lessonQuestions = [], lessonInfos = [], difficulty = "Hirte" } = await req.json();

        if (!text && lessonQuestions.length === 0 && lessonInfos.length === 0) {
            return NextResponse.json({ error: "No content provided" }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        let contextStrings = [];
        if (text) contextStrings.push(`BESCHREIBUNG DER LEKTION:\n${text}`);
        if (lessonInfos.length > 0) {
            contextStrings.push(`INFOS AUS DER LEKTION (FAKTEN):\n${lessonInfos.map((f: any) => `${f.title}: ${f.description}`).join('\n')}`);
        }
        if (lessonQuestions.length > 0) {
            contextStrings.push(`FRAGEN UND ANTWORTEN AUS DER LEKTION:\n${lessonQuestions.map((q: any, i: number) => `Frage ${i + 1}: ${q.question}\nAntwort ${i + 1}: ${q.answer}`).join('\n\n')}`);
        }

        const questionsContext = contextStrings.join('\n\n---\n\n');

        let difficultyInstruction = "";
        switch (difficulty) {
            case "Bauer":
                difficultyInstruction = `
                SCHWIERIGKEITSGRAD: LEICHT (Bauer)
                - Fokus: Faktenwissen, direktes Abfragen von in der Lektion genannten Details.
                - Sprache: Sehr einfach, kurze Sätze.
                - Distraktoren: Eindeutig falsch, weniger subtil.
                `;
                break;
            case "Gamaliel":
                difficultyInstruction = `
                SCHWIERIGKEITSGRAD: SCHWER (Gamaliel)
                - Fokus: Tiefes Verständnis, Theologische Zusammenhänge, Transferleistung.
                - Sprache: Anspruchsvoll, präzise.
                - Distraktoren: Sehr plausibel, erfordern genaues Nachdenken.
                `;
                break;
            case "Hirte":
            default:
                difficultyInstruction = `
                SCHWIERIGKEITSGRAD: MITTEL (Hirte)
                - Fokus: Verständnis der Kergedanken, Anwendung.
                - Sprache: Normal, verständlich.
                - Distraktoren: Plausibel, aber klar unterscheidbar für jemanden, der aufgepasst hat.
                `;
                break;
        }

        const prompt = `
            Du bist ein Experte für theologische Bildung. Erstelle ${count} Multiple-Choice-Fragen (Lerntest) basierend auf einer Bibellektion.

            ${THEOLOGICAL_CONSTRAINTS}

            KONTEXT DER LEKTION:
            ---
            ${questionsContext}
            ---

            ANFORDERUNGEN AN DIE FRAGEN:
            1. BEZUG: Die Fragen müssen sich eng an den zentralen Aussagen der Lektion orientieren.
            2. SPRACHE: Verwende klare und verständliche Sprache.
            ${difficultyInstruction}
            3. DISTRAKTOREN (Falschantworten): 
               - Erstelle 3 falsche Antwortmöglichkeiten pro Frage.
               - Keine unsinnigen Antworten, sie müssen im Kontext möglich erscheinen.
               - Vermeide "Alles oben genannte" oder "Nichts davon".
            4. RANDOMISIERUNG (ESSENZIELL): 
               - Die Position der richtigen Antwort (\`correct_index\`) MUSS zufällig sein.
               - Achte auf Gleichverteilung der richtigen Position (0, 1, 2, 3).

            FORMATIERUNG: JSON Array.
            Jedes Objekt muss exakt diese Struktur haben:
            {
              "question": "String",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correct_index": Number (0-3),
              "difficulty": "${difficulty}"
            }

            Antworte NUR mit dem validen JSON Array.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let textResponse = response.text();

        // Cleanup JSON
        textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();

        const questions = JSON.parse(textResponse);

        return NextResponse.json({ questions });

    } catch (error: any) {
        console.error("Generierung fehlgeschlagen:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
