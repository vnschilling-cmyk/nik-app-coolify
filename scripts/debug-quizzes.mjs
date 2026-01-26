import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Debugging quizzes on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

        // Check collection definition
        try {
            const collection = await pb.collections.getOne('quizzes');
            console.log("\nSchema Fields:");
            collection.schema.forEach(f => {
                console.log(`- ${f.name} (${f.type})`);
            });
        } catch (e) {
            console.error("Could not get collection definition (might need admin token):", e.message);
        }

        // Try fetch with sort
        console.log("\nTrying fetch with sort: 'title'...");
        try {
            const res = await pb.collection('quizzes').getFullList({
                sort: 'title'
            });
            console.log(`Fetch success! Found ${res.length} items.`);
            if (res.length > 0) {
                console.log("First item keys:", Object.keys(res[0]));
                console.log("First item title:", res[0].title);
            }
        } catch (e) {
            console.error("Fetch FAILED:", e.message);
            console.error("Data:", e.data);
        }

    } catch (e) {
        console.error("Auth Failed:", e.message);
    }
}

main();
