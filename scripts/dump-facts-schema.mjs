import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Dumping 'facts' collection schema on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
        const collection = await pb.collections.getOne('facts');

        console.log("Fields:");
        collection.fields.forEach(f => {
            console.log(`- ${f.name} (${f.type}): required=${f.required}`);
            if (f.options) {
                // console.log(`  options: ${JSON.stringify(f.options)}`);
            }
        });

        // Also check detailed schema if it's v0.26 new structure
        // console.log(JSON.stringify(collection.fields, null, 2));

    } catch (e) {
        console.error("Error:", e.message);
    }
}

main();
