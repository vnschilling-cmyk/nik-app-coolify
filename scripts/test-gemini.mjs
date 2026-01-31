import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const apiKey = process.env.GOOGLE_AI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function testGemini() {
    console.log("Testing Gemini API...");
    try {
        const model = 'gemini-2.0-flash';
        console.log(`Using model: ${model}`);

        const response = await ai.models.generateContent({
            model: model,
            contents: "Erkläre das Wort 'Hoffnung' kurz.",
        });

        console.log("Success!");
        console.log(response.text());
    } catch (e) {
        console.error("Error:", e);
        if (e.response) {
            console.error("Response:", e.response);
        }
    }
}

testGemini();
