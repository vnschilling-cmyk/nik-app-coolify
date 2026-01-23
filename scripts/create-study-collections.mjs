import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Creating Study collections on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
        console.log("Logged in as admin");

        // Create Lessons Collection
        console.log("\n1. Creating 'lessons' collection...");
        try {
            await pb.collections.create({
                name: 'lessons',
                type: 'base',
                schema: [
                    { name: 'title', type: 'text', required: true },
                    { name: 'content', type: 'editor', required: false }, // Rich text
                    { name: 'order', type: 'number', required: false },
                    { name: 'category', type: 'text', required: false },
                    { name: 'tags', type: 'text', required: false }, // Comma-separated
                ],
                listRule: "",  // Public read
                viewRule: "",
                createRule: "@request.auth.id != ''", // Logged in users
                updateRule: "@request.auth.id != ''",
                deleteRule: "@request.auth.id != ''"
            });
            console.log("   ✓ lessons created");
        } catch (e) {
            if (e.message?.includes('already exists')) {
                console.log("   → lessons already exists");
            } else {
                console.error("   Error:", e.message);
            }
        }

        // Create Facts Collection
        console.log("\n2. Creating 'facts' collection...");
        try {
            await pb.collections.create({
                name: 'facts',
                type: 'base',
                schema: [
                    { name: 'title', type: 'text', required: true },
                    { name: 'description', type: 'text', required: false },
                    { name: 'category', type: 'text', required: false },
                    { name: 'source', type: 'text', required: false },
                    { name: 'verse_ref', type: 'text', required: false }, // e.g., "Johannes 3:16"
                ],
                listRule: "",
                viewRule: "",
                createRule: "@request.auth.id != ''",
                updateRule: "@request.auth.id != ''",
                deleteRule: "@request.auth.id != ''"
            });
            console.log("   ✓ facts created");
        } catch (e) {
            if (e.message?.includes('already exists')) {
                console.log("   → facts already exists");
            } else {
                console.error("   Error:", e.message);
            }
        }

        console.log("\nDone!");

    } catch (e) {
        console.error("Failed:", e.message);
    }
}

main();
