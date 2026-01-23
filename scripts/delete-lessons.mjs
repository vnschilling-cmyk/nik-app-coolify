import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Deleting broken lessons on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

        const lessons = await pb.collection('lessons').getFullList();
        console.log(`Found ${lessons.length} lessons, deleting...`);

        for (const lesson of lessons) {
            await pb.collection('lessons').delete(lesson.id);
            console.log(`Deleted: ${lesson.id}`);
        }

        console.log("Done!");

    } catch (e) {
        console.error("Failed:", e.message);
    }
}

main();
