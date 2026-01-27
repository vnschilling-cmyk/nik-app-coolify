import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase-nik-app-coolify.195.201.231.49.nip.io');

async function promoteUser() {
    try {
        console.log("Authenticating as Admin...");
        await pb.admins.authWithPassword('admin@nik-app.de', 'Muenze1980!#');

        const admins = ["Viktor Schilling", "Manuel Lorenz"];
        const regular = ["Samuel Deder"];

        // Promote Admins
        for (const name of admins) {
            console.log(`Processing Admin: ${name}...`);
            try {
                // Fuzzy search to be safe
                const list = await pb.collection('users').getFullList({ filter: `name ~ "${name}"` });
                if (list.length > 0) {
                    for (const user of list) {
                        if (!user.is_admin) {
                            await pb.collection('users').update(user.id, { is_admin: true });
                            console.log(`  -> Promoted ${name} (ID: ${user.id}) to ADMIN.`);
                        } else {
                            console.log(`  -> ${name} (ID: ${user.id}) is already Admin.`);
                        }
                    }
                } else {
                    console.log(`  -> User ${name} NOT FOUND.`);
                }
            } catch (e) {
                console.log(`  -> Error processing ${name}: ${e.message}`);
            }
        }

        // Demote Regular
        for (const name of regular) {
            console.log(`Processing Regular: ${name}...`);
            try {
                const list = await pb.collection('users').getList(1, 1, { filter: `name ~ "${name}"` });
                if (list.items.length > 0) {
                    const user = list.items[0];
                    if (user.is_admin) {
                        await pb.collection('users').update(user.id, { is_admin: false });
                        console.log(`  -> Demoted ${name} to USER.`);
                    } else {
                        console.log(`  -> ${name} is correctly set as User.`);
                    }
                } else {
                    console.log(`  -> User ${name} NOT FOUND.`);
                }
            } catch (e) {
                console.log(`  -> Error processing ${name}: ${e.message}`);
            }
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

promoteUser();
