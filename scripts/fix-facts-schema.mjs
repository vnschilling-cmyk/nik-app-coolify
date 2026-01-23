import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Checking facts schema on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

        const facts = await pb.collections.getOne('facts');
        console.log("Collection: facts");
        console.log("ID:", facts.id);
        console.log("Current fields:", facts.fields?.length || 0);

        if (facts.fields) {
            facts.fields.forEach(f => console.log(`  - ${f.name}: ${f.type}`));
        }

        // Required fields for the new functionality
        const requiredFields = [
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'text', required: false },
            { name: 'category', type: 'text', required: false },
            { name: 'source', type: 'text', required: false },
            { name: 'verse_ref', type: 'text', required: false },
            { name: 'book_id', type: 'text', required: false },
            { name: 'chapter', type: 'number', required: false },
            { name: 'verse_start', type: 'number', required: false },
            { name: 'verse_end', type: 'number', required: false },
            { name: 'lesson_id', type: 'text', required: false }, // Link to lesson
        ];

        console.log("\nUpdating facts with all required fields...");
        await pb.collections.update(facts.id, {
            fields: requiredFields,
            listRule: "",
            viewRule: "",
            createRule: "",
            updateRule: "",
            deleteRule: ""
        });

        const updated = await pb.collections.getOne('facts');
        console.log("✓ Updated! Now has", updated.fields?.length || 0, "fields");

    } catch (e) {
        console.error("Failed:", e.message);
        if (e.data) console.error(JSON.stringify(e.data, null, 2));
    }
}

main();
