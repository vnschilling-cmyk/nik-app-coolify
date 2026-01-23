import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Checking verses collection on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

        // Get verses collection
        const verses = await pb.collections.getOne('verses');
        console.log("Collection found:", verses.name);
        console.log("Type:", verses.type);
        console.log("List Rule:", verses.listRule);
        console.log("View Rule:", verses.viewRule);
        console.log("\nSchema fields:");
        verses.schema.forEach(f => {
            console.log(`  - ${f.name}: ${f.type} (required: ${f.required})`);
        });

        // Try to get ANY record without filter
        console.log("\n--- Testing queries ---");
        console.log("\n1. Get first record (no filter):");
        try {
            const r1 = await pb.collection('verses').getList(1, 1);
            console.log(`   Total items: ${r1.totalItems}`);
            if (r1.items.length > 0) {
                console.log(`   Sample: ${JSON.stringify(r1.items[0], null, 2)}`);
            }
        } catch (e) {
            console.error(`   Error: ${e.message}`);
            if (e.data) console.error(`   Data: ${JSON.stringify(e.data)}`);
        }

    } catch (e) {
        console.error("Failed:", e);
    }
}

main();
