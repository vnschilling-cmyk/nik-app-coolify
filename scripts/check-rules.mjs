import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Checking rules on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
        console.log("Admin logged in.");
    } catch (e) {
        console.error("Login failed:", e.message);
        process.exit(1);
    }

    try {
        const books = await pb.collections.getOne('bible_books');
        console.log(`\nCollection: ${books.name}`);
        console.log(`List Rule: ${books.listRule}`);
        console.log(`View Rule: ${books.viewRule}`);

        const verses = await pb.collections.getOne('verses');
        console.log(`\nCollection: ${verses.name}`);
        console.log(`List Rule: ${verses.listRule}`);
        console.log(`View Rule: ${verses.viewRule}`);

    } catch (e) {
        console.error("Failed to fetch collections:", e);
    }
}

main();
