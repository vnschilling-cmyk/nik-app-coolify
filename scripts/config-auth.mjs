import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

const GOOGLE_CLIENT_ID = "244264360575-o7ah346ej2lsnfvre881lmcf54tvi9nh.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "YOUR_CLIENT_SECRET"; // REPLACE WITH ACTUAL SECRET OR ENV VAR

async function main() {
    console.log(`Connecting to ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
        console.log("Admin logged in.");
    } catch (e) {
        console.error("Login failed:", e.message);
        // Try localhost fallback if env url failed
        if (PB_URL.includes('nip.io')) {
            console.log("Trying localhost fallback...");
            const pbLocal = new PocketBase('http://127.0.0.1:8090');
            try {
                await pbLocal.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
                console.log("Local Admin logged in. Updating Local.");
                await updateSettings(pbLocal);
                return;
            } catch (ex) {
                console.error("Local login also failed.");
            }
        }
        process.exit(1);
    }

    await updateSettings(pb);
}

async function updateSettings(pb) {
    try {
        console.log("Fetching current settings keys...");
        const current = await pb.settings.getAll();
        console.log("Keys:", Object.keys(current).filter(k => k.toLowerCase().includes('auth')));

        console.log("Updating googleAuth...");
        const result = await pb.settings.update({
            googleAuth: {
                enabled: true,
                clientId: GOOGLE_CLIENT_ID,
                clientSecret: GOOGLE_CLIENT_SECRET,
            }
        });

        console.log("Update call finished.");

        // Verify
        const newSettings = await pb.settings.getAll();
        console.log("VERIFICATION - Google Enabled:", newSettings.googleAuth?.enabled);

    } catch (e) {
        console.error("Failed to update settings:", e);
    }
}

main();
