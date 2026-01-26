
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase-nik-app-coolify.195.201.231.49.nip.io');

async function check() {
    try {
        // await pb.admins.authWithPassword('admin@admin.com', 'password123');
        const books = await pb.collection('bible_books').getFullList();

        console.log("Total books:", books.length);
        const values = new Set(books.map(b => b.testament));
        console.log("Unique testament values:", [...values]);

        const otUpdates = books.filter(b => b.testament === 'OT').length;
        const ntUpdates = books.filter(b => b.testament === 'NT').length;
        console.log(`OT Count: ${otUpdates}, NT Count: ${ntUpdates}`);

        // Sample
        console.log("Sample Matthew:", books.find(b => b.name.includes("Matthäus")));

    } catch (e) {
        console.error(e);
    }
}

check();
