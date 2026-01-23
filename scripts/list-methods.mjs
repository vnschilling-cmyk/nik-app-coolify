import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';

async function main() {
    console.log(`Connecting to ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        const methods = await pb.collection('users').listAuthMethods();
        console.log("--- Available Auth Methods ---");
        console.log("Username/Password:", methods.usernamePassword);
        console.log("Email/Password:", methods.emailPassword);
        console.log("OAuth2 Providers:", methods.authProviders.map(p => p.name));
        console.log("------------------------------");
    } catch (e) {
        console.error("Failed to list auth methods:", e);
    }
}

main();
