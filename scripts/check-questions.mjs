
import PocketBase from 'pocketbase';

async function checkSchema() {
    const pb = new PocketBase('https://pocketbase-nik-app-coolify.195.201.231.49.nip.io');

    try {
        console.log("Checking questions collection...");
        const records = await pb.collection('questions').getList(1, 10, {
            sort: '-created'
        });

        console.log(`Found ${records.totalItems} questions.`);
        records.items.forEach((rec, i) => {
            console.log(`\nRecord ${i + 1}:`);
            console.log(JSON.stringify(rec, null, 2));
        });

    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkSchema();
