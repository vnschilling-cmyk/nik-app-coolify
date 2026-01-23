import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Adding fields to lessons on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

        const lessons = await pb.collections.getOne('lessons');
        console.log("Current lessons collection ID:", lessons.id);
        console.log("Current schema:", JSON.stringify(lessons.schema, null, 2));
        console.log("Fields property:", lessons.fields ? "exists" : "missing");

        // Maybe PocketBase uses 'fields' instead of 'schema'
        if (lessons.fields) {
            console.log("Fields:", JSON.stringify(lessons.fields, null, 2));
        }

        // Try with 'fields' property instead of 'schema'
        const fieldsToAdd = [
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

        console.log("\nTrying update with 'fields' property...");
        try {
            await pb.collections.update(lessons.id, { fields: fieldsToAdd });
            console.log("✓ Updated with 'fields'");
        } catch (e) {
            console.log("Failed with 'fields':", e.message);
        }

        // Verify
        const updated = await pb.collections.getOne('lessons');
        console.log("\nAfter update:");
        console.log("schema:", updated.schema?.length || "none");
        console.log("fields:", updated.fields?.length || "none");

    } catch (e) {
        console.error("Failed:", e.message);
        if (e.data) console.error(JSON.stringify(e.data, null, 2));
    }
}

main();
