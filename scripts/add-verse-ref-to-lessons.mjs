import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Adding verse_ref to lessons on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

        const lessons = await pb.collections.getOne('lessons');
        console.log("Found lessons collection");

        // Check if verse_ref already exists
        const existingFields = lessons.schema || [];
        const hasVerseRef = existingFields.some(f => f.name === 'verse_ref');

        if (hasVerseRef) {
            console.log("verse_ref field already exists!");
            return;
        }

        // Add verse_ref field
        const newSchema = [
            ...existingFields,
            { name: 'verse_ref', type: 'text', required: false }
        ];

        await pb.collections.update(lessons.id, { schema: newSchema });
        console.log("✓ Added verse_ref field to lessons!");

    } catch (e) {
        console.error("Failed:", e.message);
    }
}

main();
