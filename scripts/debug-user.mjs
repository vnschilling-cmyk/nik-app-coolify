import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase-nik-app-coolify.195.201.231.49.nip.io');

async function debugUser() {
    try {
        console.log("Authenticating as Admin to inspect users...");
        await pb.admins.authWithPassword('admin@nik-app.de', 'Muenze1980!#');

        // Check Collection Schema
        const collection = await pb.collections.getOne('users');
        console.log("Collection Full Object:", JSON.stringify(collection, null, 2));

        // 1. Search for Samuel Deder
        console.log("\nSearching for 'Samuel Deder'...");
        const users = await pb.collection('users').getList(1, 10, {
            filter: 'name ~ "Samuel Deder"'
        });

        if (users.items.length === 0) {
            console.log("❌ User 'Samuel Deder' NOT FOUND in database!");
        } else {
            const user = users.items[0];
            console.log("✅ User Found (Raw):", JSON.stringify(user, null, 2));

            // Force update EMAIL locally to test the "Hidden Email" strategy
            console.log("ATTEMPTING EMAIL UPDATE...");
            try {
                await pb.collection('users').update(user.id, {
                    email: 'samueldeder@nik-app.local',
                });
                console.log("Update SUCCESS.");
            } catch (err) {
                console.log("Update FAILED:", err);
            }

            // 2. Test Login with EMAIL
            console.log("\nTesting User Login (Email: samueldeder@nik-app.local)...");
            try {
                const pbUser = new PocketBase('https://pocketbase-nik-app-coolify.195.201.231.49.nip.io');
                await pbUser.collection('users').authWithPassword('samueldeder@nik-app.local', 'Jugend2024!');
                console.log("✅ Login with EMAIL successful!");
            } catch (e) {
                console.log("❌ Login with EMAIL failed:", e.message);
                if (e.response) console.log(e.response);
            }
        }

    } catch (e) {
        console.error("Debug Error:", e);
    }
}

debugUser();
