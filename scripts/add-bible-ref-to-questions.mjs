import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Adding Bible reference fields to questions on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
        console.log("Logged in as admin");

        // Get the questions collection
        const collection = await pb.collections.getOne('questions');
        console.log("Collection found:", collection.name);

        // Schema might be in different locations depending on PocketBase version
        const schema = collection.schema || collection.fields || [];
        console.log("Current schema fields:", schema.map(f => f.name));

        const existingFields = schema.map(f => f.name);
        const newFields = [];

        // Add book_id field if not exists
        if (!existingFields.includes('book_id')) {
            newFields.push({ name: 'book_id', type: 'text', required: false });
            console.log("Will add: book_id");
        }

        // Add chapter field if not exists
        if (!existingFields.includes('chapter')) {
            newFields.push({ name: 'chapter', type: 'number', required: false });
            console.log("Will add: chapter");
        }

        // Add verse_ref field if not exists
        if (!existingFields.includes('verse_ref')) {
            newFields.push({ name: 'verse_ref', type: 'text', required: false });
            console.log("Will add: verse_ref");
        }

        if (newFields.length === 0) {
            console.log("All fields already exist. No migration needed.");
            return;
        }

        // Update collection with new fields
        const updatedSchema = [...schema, ...newFields];

        await pb.collections.update('questions', {
            schema: updatedSchema
        });

        console.log(`✓ Added ${newFields.length} new fields to questions collection`);

    } catch (e) {
        console.error("Failed:", e.message);
        if (e.data) {
            console.error("Details:", JSON.stringify(e.data, null, 2));
        }
    }
}

main();
