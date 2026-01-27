import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Updating 'memory_verses' schema and migrating data on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
        console.log("Logged in as admin.");

        // 1. Update Schema
        const collection = await pb.collections.getOne('memory_verses');
        const fields = collection.fields || [];

        const hasVerseRef = fields.some(f => f.name === 'verse_ref');
        if (!hasVerseRef) {
            console.log("Adding 'verse_ref' field to 'memory_verses'...");
            fields.push({
                name: 'verse_ref',
                type: 'text',
                required: false,
                presentable: false,
                unique: false,
                options: {}
            });
            await pb.collections.update('memory_verses', { fields });
            console.log("Schema updated.");
        } else {
            console.log("'verse_ref' field already exists.");
        }

        // 2. Migrate Data
        console.log("Migrating existing data...");
        const verses = await pb.collection('memory_verses').getFullList({
            expand: 'book_id'
        });

        const books = await pb.collection('bible_books').getFullList();
        const bookMap = new Map(books.map(b => [b.id, b.name]));

        for (const verse of verses) {
            const bookName = verse.expand?.book_id?.name || bookMap.get(verse.book_id) || "Bibel";
            let verseRef = "";

            if (verse.chapter === 0) {
                verseRef = bookName;
            } else {
                const range = verse.verse_start === verse.verse_end
                    ? `${verse.verse_start}`
                    : `${verse.verse_start}-${verse.verse_end}`;
                verseRef = `${bookName} ${verse.chapter}:${range}`;
            }

            if (verse.verse_ref !== verseRef) {
                console.log(`Updating ${verse.id}: ${verseRef}`);
                await pb.collection('memory_verses').update(verse.id, {
                    verse_ref: verseRef
                });
            }
        }

        console.log("Migration complete.");
    } catch (e) {
        console.error("Error:", e.message);
        if (e.originalError) console.error("Original:", e.originalError);
    }
}

main();
