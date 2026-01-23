import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Checking settings on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
        console.log("Admin logged in.");
    } catch (e) {
        console.error("Login failed:", e.message);
        process.exit(1);
    }

    try {
        const settings = await pb.settings.getAll();
        const google = settings.googleAuth;
        console.log("--- Google Auth Settings ---");
        console.log("Enabled:", google.enabled);
        console.log("Client ID configured:", !!google.clientId);
        console.log("Client Secret configured:", !!google.clientSecret);
        if (google.clientId) console.log("Client ID prefix:", google.clientId.substring(0, 10) + "...");
        console.log("----------------------------");

    } catch (e) {
        console.error("Failed to fetch settings:", e);
    }
}

main();
