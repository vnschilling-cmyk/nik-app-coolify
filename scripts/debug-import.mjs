import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Debug Import on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
        console.log("Admin logged in.");

        // Get Book ID for Gen
        const book = await pb.collection('bible_books').getFirstListItem('short_name="Gen"');
        console.log(`Book Gen ID: ${book.id}`);

        console.log("Attempting to create ONE verse...");
        const result = await pb.collection('verses').create({
            book: book.id,
            chapter: 1,
            verse: 1,
            text: "DEBUG: Am Anfang schuf Gott Himmel und Erde.",
            translation: "DEBUG"
        });

        console.log("Success!", result);

    } catch (e) {
        console.error("FAILURE:", e);
        console.error("Data:", e.data);
    }
}

main();
