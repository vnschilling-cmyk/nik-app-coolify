import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.GOOGLE_AI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        const { query, illustrations } = await request.json();

        if (!query || !illustrations || !Array.isArray(illustrations)) {
            return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
        }

        if (illustrations.length === 0) {
            return NextResponse.json({ ids: [] });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        // We only send IDs and Titles to save tokens and stay within limits. 
        // Gemini should be able to guess relevance from titles.
        // For more accuracy, we could send snippets, but let's start with titles.
        const prompt = `Du bist ein Experte für Illustrationen und Geschichten. 
Der Benutzer sucht nach Illustrationen zum Thema: "${query}".

Hier ist eine Liste von verfügbaren Illustrationen (ID und Titel):
${illustrations.map(ill => `- ID: ${ill.id}, Titel: ${ill.title}`).join('\n')}

Wähle die IDs der Illustrationen aus, die inhaltlich am besten zu dem gesuchten Thema passen. 
Gib nur ein JSON-Array mit den passenden IDs zurück, sortiert nach Relevanz (beste zuerst).
Wenn nichts passt, gib ein leeres Array [] zurück.

Beispiel-Antwort: ["id1", "id2"]`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiText = response.text();

        try {
            const relevantIds = JSON.parse(aiText);
            return NextResponse.json({ ids: Array.isArray(relevantIds) ? relevantIds : [] });
        } catch (parseError) {
            console.error('[AI Search] JSON Parse Error:', parseError, aiText);
            return NextResponse.json({ error: 'KI-Antwort konnte nicht verarbeitet werden' }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Illustration search error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
