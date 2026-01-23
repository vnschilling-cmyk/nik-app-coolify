import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';

const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Checking verses on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
        console.log("Admin logged in to verify.");
        // 1. Get Genesis Book ID
        const book = await pb.collection('bible_books').getFirstListItem('short_name="Gen"');
        console.log(`Found Book: ${book.name} (${book.id})`);

        // Check GLOBAL count
        const allVerses = await pb.collection('verses').getList(1, 1);
        console.log(`TOTAL VERSES IN DB: ${allVerses.totalItems}`);

        // 2. Count verses
        const verses = await pb.collection('verses').getList(1, 10, {
            filter: `book="${book.id}" && chapter=1 && translation="SCH2000"`,
            sort: 'verse'
        });

        console.log(`Found ${verses.totalItems} verses for Gen 1.`);
        if (verses.items.length > 0) {
            console.log("First verse:", verses.items[0].text);
        } else {
            console.log("NO VERSES FOUND! Check 'translation' field.");
            // Debug: Check any verses for this book
            const anyVerses = await pb.collection('verses').getList(1, 1, {
                filter: `book="${book.id}"`
            });
            console.log(`Any verses for book ${book.id}? ${anyVerses.totalItems}`);
            if (anyVerses.totalItems > 0) {
                console.log("Sample verse translation:", anyVerses.items[0].translation);
            }
        }

    } catch (e) {
        console.error("Error:", e.originalError || e.message);
    }
}

main();
