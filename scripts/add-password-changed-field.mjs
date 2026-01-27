import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase-nik-app-coolify.195.201.231.49.nip.io');

async function updateSchema() {
    try {
        console.log("Authenticating as Admin...");
        await pb.admins.authWithPassword('admin@nik-app.de', 'Muenze1980!#');

        // 1. Update Schema
        console.log("Fetching collection 'users'...");
        const collection = await pb.collections.getOne('users');

        // In newer PB versions, schema is an array of fields. 
        // If collection.schema is undefined/null, default to [].
        // IMPORTANT: We need to assign it to a variable we can push to.
        const fields = collection.schema || [];

        // check if field exists
        const exists = fields.find(f => f.name === 'password_changed');
        if (!exists) {
            console.log("Field 'password_changed' missing. Adding it...");
            fields.push({
                system: false,
                id: '', // let PB generate ID
                name: 'password_changed',
                type: 'bool',
                required: false,
                presentable: false,
                unique: false,
                options: {}
            });

            // Assign back to collection object
            // Depending on PB version, we might need to send just { schema: fields } or the whole object
            // Try updating the whole object structure
            collection.schema = fields;

            await pb.collections.update('users', collection);
            console.log("Schema updated.");
        } else {
            console.log("Field 'password_changed' already exists.");
        }

        // 2. Initialize Data
        console.log("Initializing data for all users...");
        const users = await pb.collection('users').getFullList();

        let count = 0;
        for (const u of users) {
            // If field is missing or we want to force it to false (for now to force change for everyone)
            // Let's assume initialized means 'false'.
            if (u.password_changed === undefined || u.password_changed === null) {
                await pb.collection('users').update(u.id, { password_changed: false });
                count++;
            }
        }
        console.log(`Updated ${count} users to password_changed=false.`);

    } catch (e) {
        console.error("Error:", e);
    }
}

updateSchema();
