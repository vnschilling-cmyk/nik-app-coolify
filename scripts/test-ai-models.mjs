import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

// Start of Selection
const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error("No API key found in env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function main() {
    try {
        // There isn't a direct "listModels" on the instance in some versions, 
        // but we can try to get a model and run a simple prompt, or just use `gemini-1.5-flash` which SHOULD work.
        // Actually, looking at the docs, listModels usually requires a fetch to the REST API if not exposed.
        // However, let's try to just run a generation with a few known candidates.

        const candidates = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];

        for (const modelName of candidates) {
            console.log(`Testing model: ${modelName}...`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                console.log(`SUCCESS: ${modelName} works!`);
                console.log(result.response.text());
                break; // Found one that works
            } catch (e) {
                console.log(`FAILED: ${modelName} - ${e.message}`);
            }
        }

    } catch (e) {
        console.error(e);
    }
}

main();
