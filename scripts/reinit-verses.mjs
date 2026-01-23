import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Re-initializing 'verses' on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
    } catch (e) {
        console.error("Login failed:", e.message);
        process.exit(1);
    }

    try {
        const existing = await pb.collections.getOne('verses').catch(() => null);
        if (existing) {
            console.log("Deleting existing 'verses' collection...");
            await pb.collections.delete(existing.id);
        }

        console.log("Creating NEW 'verses' collection...");
        await pb.collections.create({
            name: 'verses',
            type: 'base',
            schema: [
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
            ],
            listRule: "", // Public
            viewRule: ""  // Public
        });

        console.log("Verses collection recreated successfully!");

    } catch (e) {
        console.error("Failed to reinit schema:", e);
    }
}

main();
