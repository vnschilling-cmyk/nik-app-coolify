import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase-nik-app-coolify.195.201.231.49.nip.io');

async function fixSchema() {
    try {
        console.log("Authenticating as Admin...");
        await pb.admins.authWithPassword('admin@nik-app.de', 'Muenze1980!#');

        console.log("Fetching collection 'users'...");
        const collection = await pb.collections.getOne('users');

        console.log("Keys on collection object:", Object.keys(collection));

        // Try to locate fields
        let fields = collection.fields || collection.schema || [];
        console.log(`Current fields count: ${fields.length}`);

        // Define the field
        const newField = {
            system: false,
            id: 'password_changed_idx_' + Date.now(), // Unique ID
            name: 'password_changed',
            type: 'bool',
            required: false,
            presentable: false,
            unique: false,
            options: {}
        };

        // Check if exists
        const idx = fields.findIndex(f => f.name === 'password_changed');
        if (idx !== -1) {
            console.log("Field exists, replacing...");
            fields[idx] = newField;
        } else {
            console.log("Field missing, adding...");
            fields.push(newField);
        }

        // Apply back to BOTH properties because PB JS SDK types are confusing between versions
        if (collection.fields) collection.fields = fields;
        if (collection.schema) collection.schema = fields; // 'schema' is often read-only or alias in newer versions but let's try.

        // Manually constructing update payload might be safer if SDK strips properties
        // But collection object usually works.

        console.log("Sending update...");
        await pb.collections.update('users', collection);
        console.log("Update sent.");

        // Verify
        const check = await pb.collections.getOne('users');
        const checkFields = check.fields || check.schema || [];
        const found = checkFields.find(f => f.name === 'password_changed');
        if (found) {
            console.log("✅ SUCCESS: Field persisted.");

            // Update Viktor
            console.log("Updating Viktor...");
            const v = await pb.collection('users').getFirstListItem('name ~ "Viktor Schilling"');
            await pb.collection('users').update(v.id, { password_changed: true });
            console.log("Viktor updated.");

        } else {
            console.error("❌ FAILED: Field not persisted.");
            console.log("Fields returned:", checkFields.map(f => f.name));
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

fixSchema();
