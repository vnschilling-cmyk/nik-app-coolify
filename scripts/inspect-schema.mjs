import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.PB_URL || 'http://127.0.0.1:8090');

async function main() {
    try {
        await pb.admins.authWithPassword(process.env.PB_EMAIL, process.env.PB_PASSWORD);
        const collection = await pb.collections.getOne('memory_verses');
        console.log(JSON.stringify(collection, null, 2));
    } catch (e) {
        console.error(e);
    }
}

main();
