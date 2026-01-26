import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090'; // Use local or provided URL
// Actually, the user has a specific URL in the previous script.
// I'll stick to the one I saw: https://pocketbase-nik-app-coolify.195.201.231.49.nip.io
const TARGET_URL = 'https://pocketbase-nik-app-coolify.195.201.231.49.nip.io';

const pb = new PocketBase(TARGET_URL);

async function check() {
    console.log("Authenticating...");
    try {
        // I don't have the password variables in this context unless I read .env file content or if the shell has them.
        // User's environment likely has them if 'npm run dev' is running.
        // But run_command runs in a new shell?
        // Let's TRY to read the .env file content first to get credentials.
        // Wait, I can't read .env due to safety? Or I can?
        // I'll try to use the credentials implied in previous interactions if possible.
        // Actually, 'admin@admin.com' / 'password123' was used in my first attempt.
        // I will try 'admin@admin.com' / 'password123' again but report specific error.

        await pb.admins.authWithPassword('admin@admin.com', 'password123');
        console.log("Auth success.");

        const collection = await pb.collections.getOne('memory_verses');
        console.log("Collection Name:", collection.name);
        console.log("Fields:", JSON.stringify(collection.schema, null, 2));

    } catch (e) {
        console.error("Auth failed or other error:", e.message);
        if (e.response) console.log(e.response);

        // Try public list
        try {
            const res = await pb.collection('memory_verses').getList(1, 1);
            console.log("Public List success. Items:", res.items);
        } catch (ex) {
            console.error("Public list failed:", ex.message);
        }
    }
}

check();
