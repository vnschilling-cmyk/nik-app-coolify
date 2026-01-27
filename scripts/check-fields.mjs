import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.PB_URL || 'http://127.0.0.1:8090');

async function main() {
    try {
        await pb.admins.authWithPassword(process.env.PB_EMAIL, process.env.PB_PASSWORD);
        const res = await pb.collection('memory_verses').getList(1, 1);
        if (res.items.length > 0) {
            console.log("Fields:", Object.keys(res.items[0]));
            console.log("Item:", JSON.stringify(res.items[0], null, 2));
        } else {
            console.log("No items found in memory_verses");
        }
    } catch (e) {
        console.error(e);
    }
}

main();
