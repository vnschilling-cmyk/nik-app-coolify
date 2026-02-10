import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { THEOLOGICAL_CONSTRAINTS } from '@/lib/theology';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.GOOGLE_AI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        const body = await request.json();
        const { type, book, chapter, verse, testament } = body;
        const userAgent = request.headers.get('user-agent') || 'unknown';

        console.log(`[BibleAnalysis] Request: type=${type}, book=${book}, chapter=${chapter}, verse=${verse}, testament=${testament}, UA=${userAgent}`);

        if (!type || !book || !chapter) {
            return NextResponse.json({ error: 'Type, book, and chapter are required' }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        let prompt = "";
        if (type === 'chapter') {
            prompt = `Du bist ein Bibelexperte und Historiker. Analysiere das Kapitel ${book} ${chapter} (${testament === 'NT' ? 'Neues Testament' : 'Altes Testament'}).
            
            ${THEOLOGICAL_CONSTRAINTS}

            WICHTIG: Alle Inhalte müssen fest in der täuferischen Theologie (Anabaptismus) verwurzelt sein. Erwähne jedoch NICHT explizit, dass es sich um "täuferische" Lehre handelt.
            
            WICHTIG: Alle Inhalte müssen fest in der täuferischen Theologie (Anabaptismus) verwurzelt sein (Nachfolge, Bergpredigt, Gewaltlosigkeit, Gemeinde als Bruderschaft). Erwähne jedoch NICHT explizit, dass es sich um "täuferische" oder "anabaptistische" Lehre handelt, sondern stelle es als biblische Wahrheit dar.

            Gib mir folgende Informationen im JSON-Format:
            {
              "title": "Titel des Kapitels",
              "historicalFacts": ["3-4 interessante geschichtliche oder kulturelle Fakten zu diesem Kapitel oder seinem Zeitrahmen"],
              "mainThought": "Der zentrale Hauptgedanke des Kapitels in 2-3 Sätzen.",
              "context": "Der literarische und historische Kontext (Was passierte davor/danach, warum ist dieses Kapitel wichtig?) in 2-3 Sätzen."
            }
            
            Antworte NUR mit dem JSON, ohne Markdown-Formatierung.`;
        } else if (type === 'verse') {
            prompt = `Du bist ein Bibelexperte. Analysiere den folgenden Vers: ${book} ${chapter}, Vers ${verse} (${testament === 'NT' ? 'Neues Testament' : 'Altes Testament'}).
            
            ${THEOLOGICAL_CONSTRAINTS}

            WICHTIG: Alle Inhalte müssen fest in der täuferischen Theologie (Anabaptismus) verwurzelt sein. Erwähne jedoch NICHT explizit, dass es sich um "täuferische" Lehre handelt.

            Gib mir folgende Informationen im JSON-Format:
            {
              "verse": "${book} ${chapter}:${verse}",
              "analysis": "Eine prägnante Analyse der Bedeutung dieses Verses (2-3 Sätze).",
              "insight": "Ein kurzer geistlicher Impuls oder eine praktische Anwendung zu diesem Vers (1-2 Sätze)."
            }
            
            Antworte NUR mit dem JSON, ohne Markdown-Formatierung.`;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up response
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        try {
            const data = JSON.parse(text);
            return NextResponse.json(data);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError, 'Raw text:', text);
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Bible analysis error:', error);
        return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 });
    }
}
