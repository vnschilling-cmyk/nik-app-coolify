import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Testing filter on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

        // Get a book ID
        const book = await pb.collection('bible_books').getFirstListItem('short_name="Gen"');
        console.log(`Book ID: ${book.id}`);

        // Test different filter syntaxes
        console.log("\n--- Testing filters ---");

        // Simple filter
        console.log("\n1. Just book filter:");
        try {
            const r1 = await pb.collection('verses').getList(1, 5, {
                filter: `book="${book.id}"`
            });
            console.log(`   Found: ${r1.totalItems}`);
        } catch (e) {
            console.error(`   Error: ${e.message}`);
        }

        // With chapter using ~
        console.log("\n2. Book AND chapter (different syntax):");
        try {
            const r2 = await pb.collection('verses').getList(1, 5, {
                filter: `book = "${book.id}" && chapter = 1`
            });
            console.log(`   Found: ${r2.totalItems}`);
        } catch (e) {
            console.error(`   Error: ${e.message}`);
        }

        // Just chapter
        console.log("\n3. Just chapter:");
        try {
            const r3 = await pb.collection('verses').getList(1, 5, {
                filter: `chapter = 1`
            });
            console.log(`   Found: ${r3.totalItems}`);
        } catch (e) {
            console.error(`   Error: ${e.message}`);
        }

    } catch (e) {
        console.error("Failed:", e);
    }
}

main();
