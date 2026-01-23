import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Fixing schema on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

        const collection = await pb.collections.getOne('verses');
        console.log("Found collection:", collection.name);

        const schema = collection.schema;
        const translationField = schema.find(f => f.name === 'translation');

        if (!translationField) {
            console.log("Translation field missing! Creating it...");
            schema.push({
                name: 'translation',
                type: 'text',
                required: true,
                options: {}
            });
        } else {
            console.log("Translation field exists. Type:", translationField.type);
            if (translationField.type === 'select') {
                console.log("Current Options:", translationField.options.values);
                const values = translationField.options.values || [];
                if (!values.includes('SCH2000')) {
                    console.log("Adding SCH2000 to options...");
                    values.push('SCH2000');
                    translationField.options.values = values;
                }
                if (!values.includes('DEBUG')) {
                    values.push('DEBUG'); // For our test
                }
            } else {
                console.log("Field is not a select. No changes needed usually.");
            }
        }

        await pb.collections.update(collection.id, { schema });
        console.log("Schema updated successfully!");

    } catch (e) {
        console.error("Failed to update schema:", e);
    }
}

main();
