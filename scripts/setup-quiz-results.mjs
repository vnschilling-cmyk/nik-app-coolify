import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Setting up quiz_results on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
        console.log("Logged in as admin");

        try {
            await pb.collections.create({
                name: 'quiz_results',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { maxSelect: 1, collectionId: '_pb_users_auth_', cascadeDelete: true } },
                    { name: 'quiz', type: 'relation', required: true, options: { maxSelect: 1, collectionId: 'quizzes', cascadeDelete: true } },
                    { name: 'score', type: 'number', required: true },
                    { name: 'total', type: 'number', required: true },
                    { name: 'percentage', type: 'number', required: false },
                    { name: 'grade', type: 'number', required: false },
                ],
                listRule: "@request.auth.id = user.id",
                viewRule: "@request.auth.id = user.id",
                createRule: "@request.auth.id != ''",
                updateRule: "@request.auth.id = user.id",
                deleteRule: "@request.auth.id = user.id"
            });
            console.log("   ✓ quiz_results created");
        } catch (e) {
            if (e.message?.includes('already exists')) {
                console.log("   → quiz_results already exists");
            } else {
                console.error("   Error:", e.message, e.data);
            }
        }

        console.log("\nDone!");

    } catch (e) {
        console.error("Failed:", e.message);
    }
}

main();
