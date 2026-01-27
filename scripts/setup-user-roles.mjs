import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Setting up user roles on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        // Try both old and new auth methods just in case
        try {
            await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
        } catch (e) {
            await pb.collection('_superusers').authWithPassword(PB_EMAIL, PB_PASSWORD);
        }

        const usersCollection = await pb.collections.getOne('users');

        // Add is_admin field if it doesn't exist
        const hasIsAdmin = usersCollection.fields.some(f => f.name === 'is_admin');

        if (!hasIsAdmin) {
            console.log("Adding 'is_admin' field to 'users' collection...");
            usersCollection.fields.push({
                name: 'is_admin',
                type: 'bool'
            });
            await pb.collections.update(usersCollection.id, usersCollection);
            console.log("Field added.");
        } else {
            console.log("'is_admin' field already exists.");
        }

        // Create a test user
        const testUserEmail = 'testuser@nik-app.de';
        const testUserPassword = 'testpassword123';

        try {
            const existingUser = await pb.collection('users').getFirstListItem(`email="${testUserEmail}"`);
            console.log(`Test user already exists: ${existingUser.email}`);

            // Ensure they are NOT an admin for testing restrictions
            await pb.collection('users').update(existingUser.id, {
                is_admin: false
            });
            console.log("Updated test user to be a non-admin.");

        } catch (e) {
            console.log("Creating test user...");
            await pb.collection('users').create({
                email: testUserEmail,
                password: testUserPassword,
                passwordConfirm: testUserPassword,
                emailVisibility: true,
                is_admin: false
            });
            console.log(`Test user created: ${testUserEmail} / ${testUserPassword}`);
        }

        // Ensure the CURRENT admin user (if they also exist in 'users' collection) IS an admin
        try {
            const adminUser = await pb.collection('users').getFirstListItem(`email="${PB_EMAIL}"`);
            await pb.collection('users').update(adminUser.id, {
                is_admin: true
            });
            console.log(`Admin user ${PB_EMAIL} set as app admin.`);
        } catch (e) {
            console.log(`Admin user ${PB_EMAIL} does not exist in 'users' collection yet.`);
        }

    } catch (e) {
        console.error("Failed to setup user roles:", e);
    }
}

main();
