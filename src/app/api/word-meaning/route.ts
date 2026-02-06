import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

// Common biblical words with pre-defined meanings (fallback when API fails)
const FALLBACK_WORDS: Record<string, any> = {
    'gott': {
        originalWord: 'אֱלֹהִים (Elohim) / θεός (Theos)',
        transliteration: 'Elohim (AT) / Theos (NT)',
        strongNumber: 'H430 / G2316',
        meaning: 'Der Schöpfer und Herrscher des Universums. Bezeichnet die Gottheit in ihrer Macht und Majestät.',
        synonyms: ['Der Allmächtige', 'HERR', 'Schöpfer', 'Höchster'],
        usage: 'Bezeichnet den einen wahren Gott Israels und im NT den Vater Jesu Christi.',
        rootMeaning: 'Elohim ist ein Pluralwort, das Gottes Macht und Fülle ausdrückt.'
    },
    'licht': {
        originalWord: 'אוֹר (Or) / φῶς (Phos)',
        transliteration: 'Or (AT) / Phos (NT)',
        strongNumber: 'H216 / G5457',
        meaning: 'Symbol für Gottes Gegenwart, Wahrheit, Reinheit und Erlösung.',
        synonyms: ['Helligkeit', 'Glanz', 'Schein', 'Leuchten'],
        usage: 'In der Bibel steht Licht oft für Gottes Gegenwart und das Gute im Gegensatz zur Finsternis.',
        rootMeaning: 'Die Wurzel bedeutet "leuchten, hell sein" und symbolisiert göttliche Offenbarung.'
    },
    'liebe': {
        originalWord: 'אַהֲבָה (Ahavah) / ἀγάπη (Agape)',
        transliteration: 'Ahavah (AT) / Agape (NT)',
        strongNumber: 'H160 / G26',
        meaning: 'Selbstlose, aufopfernde Liebe. Agape beschreibt Gottes bedingungslose Liebe zu den Menschen.',
        synonyms: ['Zuneigung', 'Hingabe', 'Treue', 'Barmherzigkeit'],
        usage: 'Agape ist die höchste Form der Liebe – selbstlos und unwiderruflich.',
        rootMeaning: 'Agape bedeutet eine willentliche, sich opfernde Liebe unabhängig vom Verdienst des Empfängers.'
    },
    'wort': {
        originalWord: 'דָּבָר (Davar) / λόגος (Logos)',
        transliteration: 'Davar (AT) / Logos (NT)',
        strongNumber: 'H1697 / G3056',
        meaning: 'Im NT bezeichnet Logos Jesus Christus als das fleischgewordene Wort Gottes.',
        synonyms: ['Rede', 'Aussage', 'Botschaft', 'Verkündigung'],
        usage: 'Logos im Johannes-Evangelium bezeichnet Christus als göttliche Offenbarung.',
        rootMeaning: 'Logos bedeutet sowohl "Wort" als auch "Vernunft/Plan" und verweist auf Gottes schöpferische Kraft.'
    },
    'himmel': {
        originalWord: 'שָׁמַיִם (Shamayim) / οὐρανός (Ouranos)',
        transliteration: 'Shamayim (AT) / Ouranos (NT)',
        strongNumber: 'H8064 / G3772',
        meaning: 'Der Wohnort Gottes und der Engel, sowie das sichtbare Firmament.',
        synonyms: ['Firmament', 'Höhe', 'Gottes Thron', 'Paradies'],
        usage: 'Bezeichnet sowohl den sichtbaren Himmel als auch den geistlichen Wohnort Gottes.',
        rootMeaning: 'Die Wurzel deutet auf "das Erhabene, Hohe" hin.'
    },
    'erde': {
        originalWord: 'אֶרֶץ (Eretz) / γῆ (Ge)',
        transliteration: 'Eretz (AT) / Ge (NT)',
        strongNumber: 'H776 / G1093',
        meaning: 'Die physische Erde, das Land oder die Welt der Menschen.',
        synonyms: ['Land', 'Boden', 'Welt', 'Territorium'],
        usage: 'Kann die ganze Erde oder ein bestimmtes Land (z.B. Israel) bezeichnen.',
        rootMeaning: 'Die Wurzel bedeutet "fest, gegründet" – das Fundament der Schöpfung.'
    }
};

export async function POST(request: NextRequest) {
    let word = '';

    try {
        const apiKey = process.env.GOOGLE_AI_API_KEY;
        if (!apiKey) {
            console.error('[WordMeaning] API Key missing');
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        const body = await request.json();
        word = body.word;
        const { context, testament } = body;
        const userAgent = request.headers.get('user-agent') || 'unknown';

        console.log(`[WordMeaning] Request: word=${word}, testament=${testament}, UA=${userAgent}`);

        if (!word) {
            return NextResponse.json({ error: 'Word is required' }, { status: 400 });
        }

        // Check for fallback first
        const lowerWord = word.toLowerCase();
        if (FALLBACK_WORDS[lowerWord]) {
            return NextResponse.json(FALLBACK_WORDS[lowerWord]);
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const language = testament === 'NT' ? 'Griechisch' : 'Hebräisch';
        const languageCode = testament === 'NT' ? 'Greek' : 'Hebrew';

        const prompt = `Du bist ein Bibelexperte und Sprachwissenschaftler. Analysiere das deutsche Wort "${word}" im biblischen Kontext.

Kontext: "${context || 'Bibeltext'}"
Testament: ${testament === 'NT' ? 'Neues Testament' : 'Altes Testament'}

Gib mir folgende Informationen im JSON-Format:
{
  "originalWord": "Das ${language}e/Hebräische Originalwort (in ${languageCode} Schrift)",
  "transliteration": "Aussprache in lateinischen Buchstaben",
  "strongNumber": "Strong's Nummer falls bekannt (z.B. G2316 oder H430)",
  "meaning": "Kurze Bedeutungserklärung (1-2 Sätze)",
  "synonyms": ["Liste von 3-5 deutschen Synonymen"],
  "usage": "Wie das Wort typischerweise in der Bibel verwendet wird (1 Satz)",
  "rootMeaning": "Ursprüngliche Wurzelbedeutung des ${language}en Wortes"
}

Antworte NUR mit dem JSON, ohne Markdown-Formatierung.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up response
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        try {
            const data = JSON.parse(text);
            return NextResponse.json(data);
        } catch (parseError) {
            return NextResponse.json({
                originalWord: word,
                transliteration: '',
                strongNumber: '',
                meaning: text,
                synonyms: [],
                usage: '',
                rootMeaning: ''
            });
        }
    } catch (error: any) {
        console.error('Word lookup error:', error);
        return NextResponse.json({
            originalWord: word || '—',
            transliteration: '',
            strongNumber: '',
            meaning: 'Die KI-Analyse ist aktuell nicht verfügbar. Bitte prüfe die Internetverbindung oder versuche es später erneut.',
            synonyms: [],
            usage: 'Server-seitiger Fehler beim Abrufen der Wortbedeutung.',
            rootMeaning: ''
        });
    }
}
