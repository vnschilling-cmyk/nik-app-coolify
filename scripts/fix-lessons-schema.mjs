import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Fixing lessons schema on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

        const lessons = await pb.collections.getOne('lessons');
        console.log("Found lessons collection:", lessons.id);

        // Define the COMPLETE schema
        const schema = [
            { name: 'title', type: 'text', required: true },
            { name: 'content', type: 'text', required: false },
            { name: 'category', type: 'text', required: false },
            { name: 'order', type: 'number', required: false },
            { name: 'verse_ref', type: 'text', required: false },
            { name: 'book_id', type: 'text', required: false },
            { name: 'chapter_start', type: 'number', required: false },
            { name: 'chapter_end', type: 'number', required: false },
            { name: 'verse_start', type: 'number', required: false },
            { name: 'verse_end', type: 'number', required: false },
        ];

        await pb.collections.update(lessons.id, {
            schema,
            listRule: "",
            viewRule: "",
            createRule: "",
            updateRule: "",
            deleteRule: ""
        });

        console.log("✓ Schema updated with", schema.length, "fields!");

        // Verify
        const updated = await pb.collections.getOne('lessons');
        console.log("\nVerified fields:");
        updated.schema.forEach(f => console.log(`  - ${f.name}`));

    } catch (e) {
        console.error("Failed:", e.message);
        if (e.data) console.error(JSON.stringify(e.data, null, 2));
    }
}

main();
