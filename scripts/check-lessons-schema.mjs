import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Checking lessons schema on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

        const lessons = await pb.collections.getOne('lessons');
        console.log("Collection: lessons");
        console.log("Type:", lessons.type);
        console.log("List Rule:", lessons.listRule);
        console.log("Create Rule:", lessons.createRule);

        console.log("\nSchema fields:");
        if (lessons.schema) {
            lessons.schema.forEach(f => {
                console.log(`  - ${f.name}: ${f.type} (required: ${f.required})`);
            });
        } else {
            console.log("  (no schema fields!)");
        }

    } catch (e) {
        console.error("Failed:", e.message);
    }
}

main();
