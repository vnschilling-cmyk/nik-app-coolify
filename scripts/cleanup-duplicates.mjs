import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase-nik-app-coolify.195.201.231.49.nip.io');

async function cleanupDuplicates() {
    try {
        console.log("Authenticating as Admin...");
        await pb.admins.authWithPassword('admin@nik-app.de', 'Muenze1980!#');

        console.log("Fetching all users...");
        const users = await pb.collection('users').getFullList();

        // Group by Name
        const groups = {};
        for (const u of users) {
            if (!groups[u.name]) groups[u.name] = [];
            groups[u.name].push(u);
        }

        let deletedCount = 0;

        for (const name in groups) {
            const group = groups[name];
            if (group.length > 1) {
                console.log(`\nProcessing duplicates for '${name}' (${group.length} found)`);

                // Strategy: Keep the one with @nik-app.local email (required for name-based login)
                // If multiple, accept the first one.
                // If none, take the Admin one.

                let keeper = group.find(u => u.email.endsWith('@nik-app.local'));
                if (!keeper) {
                    // No local email user found, try finding an admin
                    keeper = group.find(u => u.is_admin);
                    if (!keeper) keeper = group[0]; // Fallback to first

                    // If we kept a non-local-email user, we might need to update their email later? 
                    // For now, let's just warn.
                    console.log(`  WARN: No @nik-app.local user found for ${name}. Keeping ID ${keeper.id} (${keeper.email})`);
                }

                // Check if any *other* user in the group was admin, and if so, make sure keeper is admin
                const wasAdmin = group.some(u => u.is_admin);
                if (wasAdmin && !keeper.is_admin) {
                    console.log(`  -> Merging Admin status to keeper ${keeper.id}`);
                    await pb.collection('users').update(keeper.id, { is_admin: true });
                }

                // Delete others
                for (const u of group) {
                    if (u.id !== keeper.id) {
                        console.log(`  -> Deleting duplicate ID ${u.id} (${u.email})`);
                        await pb.collection('users').delete(u.id);
                        deletedCount++;
                    } else {
                        console.log(`  -> KEEPING ID ${u.id} (${u.email}) [Admin: ${wasAdmin}]`);
                    }
                }
            }
        }

        console.log(`\nCleanup Complete. Deleted ${deletedCount} duplicates.`);

    } catch (e) {
        console.error("Error:", e);
    }
}

cleanupDuplicates();
