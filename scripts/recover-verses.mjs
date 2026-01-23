import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Recovering 'verses' on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

        // Ensure bible_books exists for ID
        const bookCol = await pb.collections.getOne('bible_books');

        console.log("Creating 'verses' collection...");
        // Minimal schema first
        await pb.collections.create({
            name: 'verses',
            type: 'base',
            schema: [
                {
                    name: 'book',
                    type: 'relation',
                    required: true,
                    options: {
                        collectionId: bookCol.id,
                        cascadeDelete: false,
                        maxSelect: 1,
                        displayFields: []
                    }
                },
                { name: 'chapter', type: 'number', required: true },
                { name: 'verse', type: 'number', required: true },
                { name: 'text', type: 'text', required: true },
                { name: 'translation', type: 'text', required: true }
            ],
            listRule: "",
            viewRule: ""
        });

        console.log("Verses collection RECOVERED!");

        // Try to recover annotations if missing
        try {
            await pb.collections.getOne('annotations');
            console.log("Annotations exists.");
        } catch {
            console.log("Recreating annotations...");
            const usersCol = await pb.collections.getOne('users');
            const versesCol = await pb.collections.getOne('verses');

            await pb.collections.create({
                name: 'annotations',
                type: 'base',
                schema: [
                    {
                        name: 'user',
                        type: 'relation',
                        required: true,
                        options: { collectionId: usersCol.id, maxSelect: 1 }
                    },
                    {
                        name: 'verse',
                        type: 'relation',
                        required: true,
                        options: { collectionId: versesCol.id, maxSelect: 1 }
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
            console.log("Annotations RECOVERED!");
        }

    } catch (e) {
        console.error("FAILED to recover:", e);
        if (e.data) console.error(JSON.stringify(e.data, null, 2));
    }
}

main();
