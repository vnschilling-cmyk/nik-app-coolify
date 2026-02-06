import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.GOOGLE_AI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        const { topic, bibleRef, lessonContext } = await request.json();

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `Du bist ein Experte für christliche Zitate und Theologie. 
Suche 10 verbriefte (echte, bekannte) Zitate von bekannten Persönlichkeiten (Theologen, Heilige, Reformatoren, christliche Autoren), die zum folgenden Kontext passen:

${lessonContext ? `KERNGEDANKEN DER LEKTION (Primär):
${lessonContext}
` : ''}
Thema: ${topic || 'Allgemein christlich'}
Bibelstelle (optional): ${bibleRef || 'Keine Angabe'}

Gib mir die Zitate im JSON-Format als Array von Objekten zurück:
[
  {
    "text": "Das Zitat selbst",
    "author": "Name des Verfassers / Quelle"
  }
]

Wichtig:
- Die Zitate müssen echt und historisch belegt sein.
- Wenn Kerngedanken einer Lektion angegeben sind, priorisiere Zitate, die genau diese Gedanken aufgreifen oder vertiefen.
- Keine erfundenen Zitate.
- Unterschiedliche Autoren (nicht alle von einer Person).
- Sprache: Deutsch.
- Gib NUR das JSON-Array zurück, ohne Markdown-Formatierung.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up response
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        try {
            const quotes = JSON.parse(text);
            return NextResponse.json(quotes);
        } catch (parseError) {
            console.error('JSON parse error:', text);
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Quote generation error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
