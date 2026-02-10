
import PocketBase from 'pocketbase';

async function checkSchema() {
    const pb = new PocketBase('https://pocketbase-nik-app-coolify.195.201.231.49.nip.io');

    try {
        const records = await pb.collection('questions').getList(1, 1);
        if (records.items.length > 0) {
            console.log("FIELDS:", Object.keys(records.items[0]).join(', '));
        } else {
            console.log("No records found in questions.");
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkSchema();
