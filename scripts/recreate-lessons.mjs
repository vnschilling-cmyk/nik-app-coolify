import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Recreating lessons collection on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

        // Try to delete existing
        try {
            const existing = await pb.collections.getOne('lessons');
            console.log("Deleting existing lessons collection...");
            await pb.collections.delete(existing.id);
            console.log("Deleted!");
        } catch (e) {
            console.log("lessons collection doesn't exist, creating fresh...");
        }

        // Create new with full schema
        console.log("Creating lessons collection with schema...");
        await pb.collections.create({
            name: 'lessons',
            type: 'base',
            schema: [
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
            ],
            listRule: "",
            viewRule: "",
            createRule: "",
            updateRule: "",
            deleteRule: ""
        });

        console.log("✓ lessons collection created successfully!");

        // Verify
        const lessons = await pb.collections.getOne('lessons');
        console.log("Verified - Schema has", lessons.schema?.length || 0, "fields");

    } catch (e) {
        console.error("Failed:", e.message);
        if (e.data) console.error(JSON.stringify(e.data, null, 2));
    }
}

main();
