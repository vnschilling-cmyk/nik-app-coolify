import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Listing quizzes from ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

        // Get all quizzes
        const records = await pb.collection('quizzes').getFullList({
            sort: '-created',
        });

        console.log(`Found ${records.length} quizzes:`);
        records.forEach(r => {
            console.log(`- [${r.id}] ${r.title} (Lesson: ${r.lesson_id}, Questions: ${r.questions?.length || 0})`);
        });

    } catch (e) {
        console.error("Failed:", e.message);
        if (e.data) console.error("Data:", JSON.stringify(e.data, null, 2));
    }
}

main();
