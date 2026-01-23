import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`NUKING verses on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

        // 1. Delete Annotations
        try {
            const annotations = await pb.collections.getOne('annotations');
            console.log("Found annotations. Deleting...");
            await pb.collections.delete(annotations.id);
            console.log("Annotations deleted.");
        } catch (e) {
            console.log("Annotations delete skipped/failed: " + e.message);
        }

        // 2. Delete Verses
        try {
            const verses = await pb.collections.getOne('verses');
            console.log("Found verses. Deleting...");
            await pb.collections.delete(verses.id);
            console.log("Verses deleted.");
        } catch (e) {
            console.error("CRITICAL: Verses delete failed: " + e.message);
            // Try to find what references it
            // Process.exit(1) to see the error
            process.exit(1);
        }

        // 3. Create Verses
        console.log("Creating NEW verses collection...");
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
                    type: 'text', // TEXT!!!
                    required: true
                }
            ],
            listRule: "",
            viewRule: ""
        });

        // 4. Re-Create Annotations (Basic)
        console.log("Re-creating annotations...");
        await pb.collections.create({
            name: 'annotations',
            type: 'base',
            schema: [
                {
                    name: 'user',
                    type: 'relation',
                    required: true,
                    options: {
                        collectionId: (await pb.collections.getOne('users')).id,
                        maxSelect: 1
                    }
                },
                {
                    name: 'verse',
                    type: 'relation',
                    required: true,
                    options: {
                        collectionId: (await pb.collections.getOne('verses')).id,
                        maxSelect: 1
                    }
                },
                { name: 'note', type: 'text' },
                { name: 'color', type: 'text' }
            ],
            listRule: "@request.auth.id = user.id",
            viewRule: "@request.auth.id = user.id",
            createRule: "@request.auth.id != ''",
            updateRule: "@request.auth.id = user.id",
            deleteRule: "@request.auth.id = user.id"
        });

        console.log("DONE. Schema reset.");

    } catch (e) {
        console.error("FAILURE:", e);
    }
}

main();
