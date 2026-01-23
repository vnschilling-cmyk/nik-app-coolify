import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Checking schema on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

        const verses = await pb.collections.getOne('verses');
        console.log("Collection: verses");

        const translationField = verses.schema.find(f => f.name === 'translation');
        console.log("Translation Field:", translationField);

        if (translationField.options && translationField.options.values) {
            console.log("Allowed Values:", translationField.options.values);
        }

    } catch (e) {
        console.error("Failed to fetch schema:", e);
    }
}

main();
