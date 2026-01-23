import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Deleting all verses on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);
    pb.autoCancellation(false);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
        console.log("Logged in as admin");

        let deleted = 0;
        let page = 1;

        while (true) {
            // Always get page 1 since we're deleting
            const result = await pb.collection('verses').getList(1, 100);

            if (result.items.length === 0) {
                console.log("\nAll verses deleted!");
                break;
            }

            console.log(`\nBatch ${page}: Deleting ${result.items.length} records...`);

            // Delete in parallel batches of 10
            for (let i = 0; i < result.items.length; i += 10) {
                const batch = result.items.slice(i, i + 10);
                await Promise.all(batch.map(item =>
                    pb.collection('verses').delete(item.id).catch(e => {
                        console.error(`Failed to delete ${item.id}: ${e.message}`);
                    })
                ));
                deleted += batch.length;
                process.stdout.write('.');
            }

            page++;

            // Safety limit
            if (page > 500) {
                console.log("\nReached safety limit. Stopping.");
                break;
            }
        }

        console.log(`\nDeleted ${deleted} records total.`);

    } catch (e) {
        console.error("Error:", e.message);
    }
}

main();
