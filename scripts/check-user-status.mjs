import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase-nik-app-coolify.195.201.231.49.nip.io');

async function checkStatus() {
    try {
        console.log("Authenticating as Admin...");
        await pb.admins.authWithPassword('admin@nik-app.de', 'Muenze1980!#');

        const names = ["Viktor Schilling"];

        for (const name of names) {
            console.log(`\nChecking '${name}'...`);
            const list = await pb.collection('users').getFullList({
                filter: `name ~ "${name}"`
            });

            for (const u of list) {
                console.log(`     - ID: ${u.id}`);
                console.log(`       Name: ${u.name}`);
                console.log(`       Email: ${u.email}`);
                console.log(`       PasswordChanged: ${u.password_changed}`);
            }
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

checkStatus();
