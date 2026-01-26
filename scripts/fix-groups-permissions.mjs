import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    const pb = new PocketBase(PB_URL);
    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
        console.log("Logged in as admin");

        console.log("Updating groups rules...");
        await pb.collections.update('groups', {
            listRule: '@request.auth.id != ""',
            viewRule: '@request.auth.id != ""',
            createRule: '@request.auth.id != ""', // Let any logged in user sync for now
            updateRule: '@request.auth.id != ""',
            deleteRule: '@request.auth.id != ""'
        });
        console.log("✓ groups rules updated");

    } catch (e) {
        console.error("Failed:", e.message);
    }
}

main();
