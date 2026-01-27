import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase-nik-app-coolify.195.201.231.49.nip.io');

async function fixCollection() {
    try {
        console.log("Authenticating...");
        await pb.admins.authWithPassword('admin@nik-app.de', 'Muenze1980!#');

        const collection = await pb.collections.getOne('users');
        console.log("Current Options:", JSON.stringify(collection.options, null, 2));

        // Force Enable Username Auth
        console.log("Enabling Username Auth...");

        const updates = {
            options: {
                allowEmailAuth: true,
                allowUsernameAuth: true,
                manageRule: null // Keep null (admins only)
                // Note: might need to preserve other options if they exist
            }
        };

        // Merge with existing options if possible, but since we can't see them, we set defaults.
        // Assuming minPasswordLength etc have defaults.

        await pb.collections.update(collection.id, updates);
        console.log("Collection updated successfully!");

        // Verify again
        const col2 = await pb.collections.getOne('users');
        console.log("New Options:", JSON.stringify(col2.options, null, 2));

    } catch (e) {
        console.error(e);
    }
}

fixCollection();
