import PocketBase from 'pocketbase';

async function main() {
    const pb = new PocketBase('https://pocketbase-nik-app-coolify.195.201.231.49.nip.io');
    try {
        await pb.admins.authWithPassword('admin@nik-app.de', '12345678');
        console.log("Logged in as admin");

        const col = await pb.collections.getOne('group_members');
        const existingFields = col.fields;

        // Plan the new fields (FLAT structure)
        const newFieldDefinitions = [
            {
                name: 'user',
                type: 'relation',
                required: false,
                maxSelect: 1,
                collectionId: '_pb_users_auth_',
                cascadeDelete: true
            },
            {
                name: 'group',
                type: 'relation',
                required: true,
                maxSelect: 1,
                collectionId: 'pbc_3346940990',
                cascadeDelete: true
            },
            {
                name: 'role',
                type: 'select',
                required: true,
                values: ['leader', 'staff', 'youth'],
                maxSelect: 1
            },
            { name: 'ct_person_id', type: 'number' },
            { name: 'name', type: 'text' },
            { name: 'email', type: 'text' }
        ];

        // Merge: keep all existing fields, but replace if name matches
        let finalFields = [...existingFields];
        for (const nf of newFieldDefinitions) {
            const index = finalFields.findIndex(f => f.name === nf.name);
            if (index !== -1) {
                // Update existing
                finalFields[index] = { ...finalFields[index], ...nf };
            } else {
                finalFields.push(nf);
            }
        }

        // Specifically handle the 'field' -> 'user' renaming if it's there
        const fieldIndex = finalFields.findIndex(f => f.name === 'field');
        if (fieldIndex !== -1) {
            finalFields[fieldIndex].name = 'user';
            // Also ensure it has the correct options
            const userDef = newFieldDefinitions.find(d => d.name === 'user');
            finalFields[fieldIndex] = { ...finalFields[fieldIndex], ...userDef };
        }

        await pb.collections.update(col.id, {
            fields: finalFields,
            listRule: '@request.auth.id != ""',
            viewRule: '@request.auth.id != ""',
            createRule: '@request.auth.id != ""',
            updateRule: '@request.auth.id != ""',
            deleteRule: '@request.auth.id != ""'
        });
        console.log("✓ group_members schema updated");

    } catch (e) {
        console.error("Failed:", e.message, JSON.stringify(e.data));
    }
}

main();
