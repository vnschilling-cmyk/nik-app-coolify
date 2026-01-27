import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase-nik-app-coolify.195.201.231.49.nip.io');

async function verifyAdmin() {
    try {
        console.log("Authenticating as Admin...");
        await pb.admins.authWithPassword('admin@nik-app.de', 'Muenze1980!#');

        const name = "Viktor Schilling";
        const list = await pb.collection('users').getList(1, 1, { filter: `name = "${name}"` });

        if (list.items.length > 0) {
            const user = list.items[0];
            console.log(`User: ${user.name}`);
            console.log(`Email: ${user.email}`);
            console.log(`IS_ADMIN: ${user.is_admin}`);
        } else {
            console.log("User not found.");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

verifyAdmin();
