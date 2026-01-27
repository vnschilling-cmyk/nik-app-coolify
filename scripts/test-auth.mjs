import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL;
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function test() {
    const pb = new PocketBase(PB_URL);
    console.log(`URL: ${PB_URL}`);
    console.log(`EMAIL: ${PB_EMAIL}`);
    console.log(`PASS: ${PB_PASSWORD}`);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
        console.log("Auth success (admins)!");
    } catch (e) {
        console.log("Auth failed (admins):", e.message);
        try {
            await pb.collection('_superusers').authWithPassword(PB_EMAIL, PB_PASSWORD);
            console.log("Auth success (_superusers)!");
        } catch (e2) {
            console.log("Auth failed (_superusers):", e2.message);
        }
    }
}

test();
