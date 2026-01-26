import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Creating Questions collection on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
        console.log("Logged in as admin");

        // Get lessons collection ID for relation
        const lessonsCollection = await pb.collections.getOne('lessons');
        console.log(`Found lessons collection: ${lessonsCollection.id}`);

        // Create Questions Collection
        console.log("\n1. Creating 'questions' collection...");
        try {
            await pb.collections.create({
                name: 'questions',
                type: 'base',
                schema: [
                    { name: 'question', type: 'text', required: true },
                    {
                        name: 'category',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['bibeltext', 'allgemein']
                        }
                    },
                    {
                        name: 'lesson_id',
                        type: 'relation',
                        required: true,
                        options: {
                            collectionId: lessonsCollection.id,
                            cascadeDelete: false,
                            maxSelect: 1,
                            displayFields: ['title']
                        }
                    },
                    { name: 'verse_start', type: 'number', required: false },
                    { name: 'verse_end', type: 'number', required: false },
                    { name: 'answer', type: 'editor', required: false },
                    { name: 'is_answered', type: 'bool', required: false },
                    { name: 'order', type: 'number', required: false },
                ],
                listRule: "",  // Public read
                viewRule: "",
                createRule: "@request.auth.id != ''", // Logged in users
                updateRule: "@request.auth.id != ''",
                deleteRule: "@request.auth.id != ''"
            });
            console.log("   ✓ questions created");
        } catch (e) {
            if (e.message?.includes('already exists')) {
                console.log("   → questions already exists");
            } else {
                console.error("   Error:", e.message);
                console.error("   Details:", JSON.stringify(e.data, null, 2));
            }
        }

        console.log("\nDone!");

    } catch (e) {
        console.error("Failed:", e.message);
    }
}

main();
