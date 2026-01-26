import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Listing lessons from ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

        const records = await pb.collection('lessons').getFullList({
            sort: 'order,title',
        });

        console.log(`Found ${records.length} lessons:`);
        records.forEach(r => {
            console.log(`- [${r.id}] ${r.title} (Category: ${r.category}, Order: ${r.order})`);
        });

    } catch (e) {
        console.error("Failed:", e.message);
        if (e.data) console.error("Data:", JSON.stringify(e.data, null, 2));
    }
}

main();
