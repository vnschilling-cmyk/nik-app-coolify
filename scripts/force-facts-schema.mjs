import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Force updating facts schema on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

        // Get facts collection
        let facts;
        try {
            facts = await pb.collections.getOne('facts');
            console.log("Found existing facts collection");
        } catch (e) {
            console.log("facts not found, creating...");
            facts = await pb.collections.create({
                name: 'facts',
                type: 'base'
            });
        }

        console.log("Collection ID:", facts.id);
        console.log("Current fields count:", facts.fields?.length || 0);

        // Get current fields (keep the id field)
        const currentFields = facts.fields || [];
        const idField = currentFields.find(f => f.name === 'id');

        // New fields to add
        const newFields = [
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'text', required: false },
            { name: 'category', type: 'text', required: false },
            { name: 'source', type: 'text', required: false },
            { name: 'verse_ref', type: 'text', required: false },
            { name: 'book_id', type: 'text', required: false },
            { name: 'chapter', type: 'number', required: false },
            { name: 'verse_start', type: 'number', required: false },
            { name: 'verse_end', type: 'number', required: false },
            { name: 'lesson_id', type: 'text', required: false },
        ];

        // Combine id field with new fields
        const allFields = idField ? [idField, ...newFields] : newFields;

        console.log("\nUpdating with", allFields.length, "fields...");

        const result = await pb.collections.update(facts.id, {
            fields: allFields,
            listRule: "",
            viewRule: "",
            createRule: "",
            updateRule: "",
            deleteRule: ""
        });

        console.log("Update result - fields:", result.fields?.length);

        // Double check
        const verify = await pb.collections.getOne('facts');
        console.log("\nVerification:");
        console.log("Fields count:", verify.fields?.length || 0);
        if (verify.fields) {
            verify.fields.forEach(f => console.log(`  - ${f.name}: ${f.type}`));
        }

    } catch (e) {
        console.error("Error:", e.message);
        if (e.data) console.error("Details:", JSON.stringify(e.data, null, 2));
    }
}

main();
