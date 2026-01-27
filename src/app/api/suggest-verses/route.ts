import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.GOOGLE_AI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API key must be set when using the Gemini API.' }, { status: 500 });
        }
        const ai = new GoogleGenAI({ apiKey });

        const { title, content, category } = await request.json();

        if (!title) {
            return NextResponse.json({ error: 'Lesson title is required' }, { status: 400 });
        }

        const prompt = `Du bist ein Bibelexperte. Schlage mir 5 passende "Lernverse" (Memory Verses) für folgende Lektion vor.
Die Verse sollen den Kern der Lektion biblisch untermauern.

Lektion: "${title}"
Kategorie: "${category || 'Allgemein'}"
Inhalt/Kontext: "${(content || '').substring(0, 500)}..."

Gib mir eine JSON-Antwort mit einer Liste von Vorschlägen.
Format:
[
  {
    "book": "Name des Buches (Deutsch, z.B. Johannes, 1. Mose)",
    "chapter": 3,
    "verse_start": 16,
    "verse_end": 16,
    "text": "Der Vers-Text (Schlachter 2000 oder Elberfelder)",
    "reason": "Kurze Begründung warum dieser Vers passt"
  }
]

Antworte NUR mit dem JSON.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });

        let text = response.text || '';
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        try {
            const data = JSON.parse(text);
            return NextResponse.json(data);
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError, text);
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Suggest verses error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
