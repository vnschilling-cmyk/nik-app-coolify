import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Adding new fields to lessons on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

        const lessons = await pb.collections.getOne('lessons');
        const existingFields = lessons.schema || [];
        const existingNames = existingFields.map(f => f.name);

        const newFields = [];

        if (!existingNames.includes('book_id')) {
            newFields.push({ name: 'book_id', type: 'text', required: false });
        }
        if (!existingNames.includes('chapter_start')) {
            newFields.push({ name: 'chapter_start', type: 'number', required: false });
        }
        if (!existingNames.includes('chapter_end')) {
            newFields.push({ name: 'chapter_end', type: 'number', required: false });
        }
        if (!existingNames.includes('verse_start')) {
            newFields.push({ name: 'verse_start', type: 'number', required: false });
        }
        if (!existingNames.includes('verse_end')) {
            newFields.push({ name: 'verse_end', type: 'number', required: false });
        }

        if (newFields.length === 0) {
            console.log("All fields already exist!");
            return;
        }

        const updatedSchema = [...existingFields, ...newFields];
        await pb.collections.update(lessons.id, { schema: updatedSchema });
        console.log(`✓ Added ${newFields.length} new fields:`, newFields.map(f => f.name).join(', '));

    } catch (e) {
        console.error("Failed:", e.message);
    }
}

main();
