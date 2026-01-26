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

        let collection;
        try {
            collection = await pb.collections.getOne('quiz_results');
            console.log("Found quiz_results collection");
        } catch (e) {
            console.log("Creating quiz_results collection...");
            collection = await pb.collections.create({
                name: 'quiz_results',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { maxSelect: 1, collectionId: '_pb_users_auth_', cascadeDelete: true } },
                    { name: 'quiz', type: 'relation', required: true, options: { maxSelect: 1, collectionId: 'quizzes', cascadeDelete: true } },
                    { name: 'score', type: 'number', required: true },
                    { name: 'total', type: 'number', required: true },
                    { name: 'percentage', type: 'number', required: false },
                    { name: 'grade', type: 'number', required: false },
                ]
            });
        }

        console.log("Updating rules...");
        await pb.collections.update(collection.id, {
            listRule: 'user = @request.auth.id',
            viewRule: 'user = @request.auth.id',
            createRule: '@request.auth.id != ""',
            updateRule: 'user = @request.auth.id',
            deleteRule: 'user = @request.auth.id'
        });
        console.log("✓ quiz_results rules updated");

    } catch (e) {
        console.error("Failed:", e.message);
    }
}

main();
