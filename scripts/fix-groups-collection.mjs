import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase-nik-app-coolify.195.201.231.49.nip.io');

async function main() {
    try {
        await pb.admins.authWithPassword('admin@nik-app.de', '12345678');
        console.log("Logged in as admin");

        const groupCol = await pb.collections.getOne('groups');

        // Fix name field max length if it's 0
        const nameField = groupCol.fields.find(f => f.name === 'name');
        if (nameField && nameField.max === 0) {
            console.log("Fixing name field max length...");
            nameField.max = 255;
        }

        await pb.collections.update(groupCol.id, {
            fields: groupCol.fields,
            listRule: '@request.auth.id != ""',
            viewRule: '@request.auth.id != ""',
            createRule: '@request.auth.id != ""',
            updateRule: '@request.auth.id != ""',
            deleteRule: '@request.auth.id != ""'
        });
        console.log("✓ groups collection updated successfully");

    } catch (e) {
        console.error("Failed:", e.message, e.data);
    }
}

main();
