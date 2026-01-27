import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
        const usersCollection = await pb.collections.getOne('users');
        console.log("Collection keys:", Object.keys(usersCollection));
        if (usersCollection.fields) {
            console.log("Fields:", usersCollection.fields.map(f => f.name));
        }
    } catch (e) {
        console.error(e);
    }
}

main();
