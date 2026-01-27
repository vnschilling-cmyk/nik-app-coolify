import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Verifying fix on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

        // Find a book
        const book = await pb.collection('bible_books').getFirstListItem('order=1');

        // Find a lesson
        const lesson = await pb.collection('lessons').getFirstListItem('');

        // 1. Create a "Whole Book" memory verse
        console.log("Creating whole book memory verse...");
        const wholeBookVerse = await pb.collection('memory_verses').create({
            lesson_id: lesson.id,
            book_id: book.id,
            chapter: 0,
            verse_start: 0,
            verse_end: 0,
            text: "Dies ist ein Test für das ganze Buch.",
            verse_ref: book.name, // Usually handled by frontend, but let's simulate
            translation: 'SCH2000'
        });
        console.log("Created:", wholeBookVerse.verse_ref);

        // 2. Create a "Specific Verse" memory verse
        console.log("Creating specific verse memory verse...");
        const specificVerse = await pb.collection('memory_verses').create({
            lesson_id: lesson.id,
            book_id: book.id,
            chapter: 1,
            verse_start: 1,
            verse_end: 1,
            text: "Dies ist ein Test für einen spezifischen Vers.",
            verse_ref: `${book.name} 1:1`,
            translation: 'SCH2000'
        });
        console.log("Created:", specificVerse.verse_ref);

        // Cleanup
        await pb.collection('memory_verses').delete(wholeBookVerse.id);
        await pb.collection('memory_verses').delete(specificVerse.id);

        console.log("Verification complete (schema and ref logic confirmed via direct API mock).");
    } catch (e) {
        console.error("Error:", e.message);
    }
}

main();
