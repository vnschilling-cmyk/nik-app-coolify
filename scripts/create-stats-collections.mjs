import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Setting up collections on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
        console.log("Logged in as admin");

        // 1. quiz_results
        console.log("\n1. Creating 'quiz_results' collection...");
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
            console.log("   → quiz_results skip:", e.message);
        }

        // 2. groups
        console.log("\n2. Creating 'groups' collection...");
        try {
            await pb.collections.create({
                name: 'groups',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'ct_id', type: 'number', required: false },
                ],
                listRule: "@request.auth.id != ''",
                viewRule: "@request.auth.id != ''",
                createRule: "@request.auth.id != '' && @request.auth.role = 'admin'", // Assuming role check
                updateRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
                deleteRule: "@request.auth.id != '' && @request.auth.role = 'admin'"
            });
            console.log("   ✓ groups created");
        } catch (e) {
            console.log("   → groups skip:", e.message);
        }

        // 3. group_members
        console.log("\n3. Creating 'group_members' collection...");
        try {
            await pb.collections.create({
                name: 'group_members',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { maxSelect: 1, collectionId: '_pb_users_auth_', cascadeDelete: true } },
                    { name: 'group', type: 'relation', required: true, options: { maxSelect: 1, collectionId: 'groups', cascadeDelete: true } },
                ],
                listRule: "@request.auth.id != ''",
                viewRule: "@request.auth.id != ''",
                createRule: "@request.auth.id != ''",
                updateRule: "@request.auth.id != ''",
                deleteRule: "@request.auth.id != ''"
            });
            console.log("   ✓ group_members created");
        } catch (e) {
            console.log("   → group_members skip:", e.message);
        }

        console.log("\nDone!");

    } catch (e) {
        console.error("Failed:", e.message);
    }
}

main();
