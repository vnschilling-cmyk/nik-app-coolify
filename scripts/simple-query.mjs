import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Simple query test on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
        console.log("Logged in as admin");

        // Just get first record
        console.log("\nGetting first verse record...");
        const result = await pb.collection('verses').getList(1, 1);
        console.log(`Total records in verses: ${result.totalItems}`);

        if (result.items.length > 0) {
            console.log("First item:");
            console.log(JSON.stringify(result.items[0], null, 2));
        }

    } catch (e) {
        console.error("Error:", e.message);
        if (e.originalError) console.error("Original:", e.originalError);
    }
}

main();
