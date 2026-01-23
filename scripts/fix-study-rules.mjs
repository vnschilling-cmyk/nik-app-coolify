import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Fixing API rules on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

        // Fix lessons rules
        const lessons = await pb.collections.getOne('lessons');
        await pb.collections.update(lessons.id, {
            listRule: "",
            viewRule: "",
            createRule: "",  // Allow everyone
            updateRule: "",
            deleteRule: ""
        });
        console.log("✓ lessons rules fixed");

        // Fix facts rules
        const facts = await pb.collections.getOne('facts');
        await pb.collections.update(facts.id, {
            listRule: "",
            viewRule: "",
            createRule: "",
            updateRule: "",
            deleteRule: ""
        });
        console.log("✓ facts rules fixed");

        console.log("\nDone! Anyone can now create/edit/delete lessons and facts.");

    } catch (e) {
        console.error("Failed:", e.message);
    }
}

main();
