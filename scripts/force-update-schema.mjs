import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Force Updating 'verses' schema on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

        const collection = await pb.collections.getOne('verses');

        // Define NEW schema
        const newSchema = [
            {
                name: 'book',
                type: 'relation',
                required: true,
                options: {
                    collectionId: (await pb.collections.getOne('bible_books')).id,
                    cascadeDelete: false,
                    maxSelect: 1,
                    displayFields: []
                }
            },
            { name: 'chapter', type: 'number', required: true },
            { name: 'verse', type: 'number', required: true },
            { name: 'text', type: 'text', required: true },
            {
                name: 'translation',
                type: 'text', // Permissive!
                required: true
            }
        ];

        await pb.collections.update(collection.id, { schema: newSchema });
        console.log("Schema UPDATED successfully!");

    } catch (e) {
        console.error("Failed to update schema:", e);
    }
}

main();
