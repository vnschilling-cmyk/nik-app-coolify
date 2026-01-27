import PocketBase from 'pocketbase';

const PB_URL = 'https://pocketbase-nik-app-coolify.195.201.231.49.nip.io';
const pb = new PocketBase(PB_URL);

async function checkRemote() {
    try {
        const books = await pb.collection('bible_books').getFullList();
        console.log(`Remote books count: ${books.length}`);
        if (books.length > 0) {
            console.log(`Sample book: ${books[0].name} (${books[0].short_name})`);
        }
    } catch (e) {
        console.error(`Failed to connect to remote: ${e.message}`);
    }
}

checkRemote();
