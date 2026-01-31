import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

const apiKey = process.env.GOOGLE_AI_API_KEY;

if (!apiKey) {
    console.error("No API key found in GOOGLE_AI_API_KEY");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function main() {
    try {
        // The SDK doesn't have a direct listModels, so we must use fetch to the API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            console.error("API Error:", data.error);
        } else {
            console.log("Available Models:");
            data.models?.forEach(m => {
                console.log(`- ${m.name} (${m.displayName})`);
            });
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

main();
