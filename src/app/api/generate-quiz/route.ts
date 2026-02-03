
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Ensure API key is present
const API_KEY = process.env.GOOGLE_AI_API_KEY;

export async function POST(req: Request) {
    if (!API_KEY) {
        return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
    }

    try {
        const { text, count = 5, lessonQuestions = [], lessonInfos = [] } = await req.json();

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

        const prompt = `
            Du bist ein Experte für theologische Bildung. Erstelle ${count} anspruchsvolle Multiple-Choice-Fragen (Lerntest) basierend auf einer Bibellektion.

            KONTEXT DER LEKTION:
            ---
            ${questionsContext}
            ---

            ANFORDERUNGEN AN DIE FRAGEN:
            1. BEZUG: Die Fragen müssen sich eng an den zentralen Aussagen der Lektion (Beschreibung, Infos und Fragen) orientieren.
            2. SPRACHE (WICHTIG): Verwende ausnahmslos **EINFACHE SPRACHE**. 
               - Benutze kurze Sätze.
               - Vermeide Fremdwörter und schwierige Begriffe. Wenn ein schwieriges Wort wichtig ist, erkläre es kurz.
               - Die Fragestellung muss direkt und leicht verständlich sein.
            3. SCHWIERIGKEITSGRAD: Trotz einfacher Sprache sollen es Transferfragen sein, die das Verständnis prüfen, nicht nur einfaches Ablesen.
            4. DISTRAKTOREN (Falschantworten): 
               - Erstelle 3 falsche Antwortmöglichkeiten pro Frage.
               - Auch die Falschantworten müssen in EINFACHER SPRACHE verfasst sein.
               - Die Distraktoren müssen PLAUSIBEL sein. Keine unsinnigen oder offensichtlich falschen Antworten. 
               - Vermeide "Alles oben genannte" oder "Nichts davon".
            5. RANDOMISIERUNG (ESSENZIELL): 
               - Die Position der richtigen Antwort (\`correct_index\`) MUSS über alle Fragen hinweg zufällig verteilt sein.
               - Vermeide Muster (z.B. nicht immer die 3. Option als richtig wählen).
               - Achte darauf, dass jede Position (0, 1, 2, 3) ungefähr gleich oft als richtige Antwort vorkommt.

            FORMATIERUNG: JSON Array.
            Jedes Objekt muss exakt diese Struktur haben:
            {
              "question": "String",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correct_index": Number (0-3)
            }

            Antworte NUR mit dem validen JSON Array, ohne Markdown-Formatierung oder zusätzliche Erklärungen.
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
