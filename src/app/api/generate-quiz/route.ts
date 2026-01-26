
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Ensure API key is present
const API_KEY = process.env.GOOGLE_AI_API_KEY;

export async function POST(req: Request) {
    if (!API_KEY) {
        return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
    }

    try {
        const { text, count = 5 } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "No text provided" }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            Erstelle ${count} Multiple-Choice-Fragen basierend auf folgendem Text.
            Der Text ist eine Bibellektion.
            
            Text: "${text.substring(0, 5000)}"

            Formatierung: JSON Array.
            Jedes Objekt muss haben:
            - question (String)
            - options (Array von 4 Strings, einer davon korrekt)
            - correct_index (Number, 0-3)

            Antworte NUR mit dem JSON Array, kein Markdown.
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
