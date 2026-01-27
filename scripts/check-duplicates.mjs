import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase-nik-app-coolify.195.201.231.49.nip.io');

async function checkDuplicates() {
    try {
        console.log("Authenticating as Admin...");
        await pb.admins.authWithPassword('admin@nik-app.de', 'Muenze1980!#');

        const names = ["Viktor Schilling", "Manuel Lorenz"];

        for (const name of names) {
            console.log(`\nSearching for '${name}'...`);
            const list = await pb.collection('users').getFullList({
                filter: `name ~ "${name}"`
            });

            if (list.length === 0) {
                console.log("  -> No users found.");
            } else {
                console.log(`  -> Found ${list.length} users:`);
                for (const u of list) {
                    console.log(`     - ID: ${u.id}`);
                    console.log(`       Name: ${u.name}`);
                    console.log(`       Email: ${u.email}`);
                    console.log(`       IsAdmin: ${u.is_admin}`);
                    console.log(`       Username: ${u.username}`);
                    console.log("       ---");
                }
            }
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

checkDuplicates();
