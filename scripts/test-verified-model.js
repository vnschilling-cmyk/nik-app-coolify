import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

const apiKey = process.env.GOOGLE_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function main() {
    try {
        console.log("Testing with gemini-2.0-flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Hello! Analyze the word 'Grace' in a biblical context.");
        console.log("SUCCESS!");
        console.log(result.response.text());
    } catch (e) {
        console.error("SDK Error:", e);
    }
}

main();
