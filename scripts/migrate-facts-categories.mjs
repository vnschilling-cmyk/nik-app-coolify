import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Migrating 'facts' schema on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

        const collection = await pb.collections.getOne('facts');
        console.log("Current schema version:", collection.fields ? "v0.2x" : "v0.1x");

        let fields = collection.fields || collection.schema || [];

        let needsUpdate = false;

        // 1. Add 'word' field (text)
        if (!fields.find(f => f.name === 'word')) {
            console.log("Adding 'word' field...");
            fields.push({
                name: 'word',
                type: 'text',
                required: false,
                system: false
            });
            needsUpdate = true;
        }

        // 2. Add 'fact_kind' field (select)
        if (!fields.find(f => f.name === 'fact_kind')) {
            console.log("Adding 'fact_kind' field...");
            fields.push({
                name: 'fact_kind',
                type: 'select',
                required: false,
                system: false,
                values: ['info', 'word_study', 'quote'], // PB v0.23+ uses top-level values
                options: {
                    values: ['info', 'word_study', 'quote'], // PB <v0.23 uses options.values
                    maxSelect: 1
                }
            });
            needsUpdate = true;
        }

        if (needsUpdate) {
            console.log("Applying updates...");
            // Send both fields and schema to be safe for intermediate versions
            const updateData = {
                fields: fields,
                schema: fields
            };
            await pb.collections.update(collection.id, updateData);
            console.log("Schema updated successfully!");
        } else {
            console.log("Schema is already up to date.");
        }

    } catch (e) {
        console.error("Migration failed:", e.message);
        if (e.response) {
            console.error("Details:", JSON.stringify(e.response.data, null, 2));
        }
    }
}

main();
