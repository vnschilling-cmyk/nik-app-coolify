import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase-nik-app-coolify.195.201.231.49.nip.io');

async function checkRules() {
    try {
        console.log("Authenticating as Admin...");
        await pb.admins.authWithPassword('admin@nik-app.de', 'Muenze1980!#');

        console.log("Fetching collection 'users'...");
        const collection = await pb.collections.getOne('users');

        console.log("--- API Rules ---");
        console.log("listRule:", collection.listRule);
        console.log("viewRule:", collection.viewRule);
        console.log("createRule:", collection.createRule);
        console.log("updateRule:", collection.updateRule);
        console.log("deleteRule:", collection.deleteRule);
        console.log("-----------------");

    } catch (e) {
        console.error("Error:", e);
    }
}

checkRules();
