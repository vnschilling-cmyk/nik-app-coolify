import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    const pb = new PocketBase(PB_URL);

    try {
        console.log("Authenticating as Superuser...");
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

        console.log(`Checking if app user '${PB_EMAIL}' exists...`);
        try {
            const user = await pb.collection('users').getFirstListItem(`email="${PB_EMAIL}"`);
            console.log("User already exists. Updating admin status...");
            await pb.collection('users').update(user.id, {
                is_admin: true
            });
            console.log("User updated.");
        } catch (e) {
            console.log("User not found. Creating app user for admin...");
            await pb.collection('users').create({
                email: PB_EMAIL,
                password: PB_PASSWORD,
                passwordConfirm: PB_PASSWORD,
                emailVisibility: true,
                is_admin: true,
                name: "Admin"
            });
            console.log("App user created successfully!");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
