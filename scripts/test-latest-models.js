import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

const apiKey = process.env.GOOGLE_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function main() {
    const models = ["gemini-1.5-flash", "gemini-flash-latest", "gemini-pro-latest"];
    for (const modelName of models) {
        try {
            console.log(`Testing with ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello!");
            console.log(`SUCCESS with ${modelName}!`);
            console.log(result.response.text());
            return;
        } catch (e) {
            console.error(`FAILED with ${modelName}:`, e.status, e.statusText);
        }
    }
}

main();
