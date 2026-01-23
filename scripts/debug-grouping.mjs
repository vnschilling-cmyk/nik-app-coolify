import PocketBase from 'pocketbase';

// Attempt to connect to local PocketBase
const pb = new PocketBase('http://127.0.0.1:8090');

async function main() {
    try {
        // Log in as admin if needed, or assume public read
        // await pb.admins.authWithPassword('test@example.com', '123456');

        const records = await pb.collection('lessons').getFullList({
            expand: 'book_id',
            sort: '-created'
        });

        console.log(`Found ${records.length} lessons.`);
        if (records.length > 0) {
            console.log("First lesson structure:");
            console.log(JSON.stringify(records[0], null, 2));

            const withExpand = records.filter(r => r.expand && r.expand.book_id);
            console.log(`\nLessons with expand.book_id: ${withExpand.length}`);
            if (withExpand.length > 0) {
                console.log("Example expanded book:");
                console.log(JSON.stringify(withExpand[0].expand.book_id, null, 2));
            } else {
                console.log("No lessons have expand.book_id populated.");
                // Check if they have book_id set
                const withBookId = records.filter(r => r.book_id);
                console.log(`Lessons with book_id field set: ${withBookId.length}`);
                if (withBookId.length > 0) {
                    console.log(`Example book_id: ${withBookId[0].book_id}`);
                }
            }
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
