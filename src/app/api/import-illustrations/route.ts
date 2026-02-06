import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.GOOGLE_AI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        const { text } = await request.json();
        if (!text) {
            return NextResponse.json({ error: 'Kein Text übermittelt' }, { status: 400 });
        }

        const inputLength = text.length;
        console.log(`[AI Import] Received text of length: ${inputLength}`);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const prompt = `Analysiere den folgenden Text, der christliche Illustrationen/Geschichten enthält. 
Teile den Text in einzelne, inhaltlich zusammenhängende Illustrationen auf.
Ersetze im gesamten Text das Wort "Kirche" durch "Gemeinde" (auch in Zusammensetzungen).

WICHTIG: Wenn der Text sehr lang ist, verarbeite so viel wie möglich, aber bleibe innerhalb deiner Token-Limits. 

Gib das Ergebnis als JSON-Array von Objekten zurück:
[
  {
    "title": "Kurzer, prägnanter Titel",
    "content": "Der Inhalt der Illustration in Markdown-Formatierung."
  }
]

Text:
${text}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;

        // Handle safety filters
        if (response.candidates?.[0]?.finishReason === 'SAFETY') {
            console.error('[AI Import] Blocked by safety filter');
            return NextResponse.json({ error: 'Der Inhalt wurde von den Sicherheitsfiltern blockiert.' }, { status: 400 });
        }

        const aiText = response.text();
        console.log('[AI Import] AI Response Length:', aiText.length);

        try {
            const illustrations = JSON.parse(aiText);

            if (!Array.isArray(illustrations)) {
                console.error('[AI Import] Not an array:', aiText);
                return NextResponse.json({ error: 'Die KI hat kein Array zurückgegeben.' }, { status: 500 });
            }

            // Final safety pass for "Kirche" -> "Gemeinde" replacement and cleanup
            const processed = illustrations.map((ill: any) => ({
                title: (ill.title || "Illustration ohne Titel").trim(),
                content: (ill.content || "")
                    .replace(/Kirche/g, 'Gemeinde')
                    .replace(/kirchen/g, 'gemeinden')
                    .replace(/Kirchen/g, 'Gemeinden')
                    .replace(/kirche/g, 'gemeinde')
                    .trim()
            }));

            return NextResponse.json(processed);
        } catch (parseError) {
            console.error('[AI Import] JSON Parse Error:', parseError);
            console.error('[AI Import] Content:', aiText);
            return NextResponse.json({
                error: 'Die Antwort der KI konnte nicht verarbeitet werden.',
                details: aiText.substring(0, 200) + "..."
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Illustration import error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
