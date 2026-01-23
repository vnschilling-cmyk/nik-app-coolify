import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Checking lessons on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

        const lessons = await pb.collection('lessons').getFullList();
        console.log(`Found ${lessons.length} lessons:`);

        lessons.forEach(l => {
            console.log(`- ${l.title || "(no title)"} | Category: ${l.category} | Book: ${l.book_id || "none"}`);
        });

    } catch (e) {
        console.error("Failed:", e.message);
    }
}

main();
