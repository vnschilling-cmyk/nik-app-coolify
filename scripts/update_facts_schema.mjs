import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Updating 'facts' schema on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

        let collection;
        try {
            collection = await pb.collections.getOne('facts');
        } catch (e) {
            console.error("Collection 'facts' not found!");
            return;
        }

        console.log("Found collection:", collection.name);

        // PB v0.23+ uses 'fields', older versions used 'schema'
        // We will try to use 'fields' if available, otherwise 'schema'
        let fields = collection.fields || collection.schema || [];

        if (!Array.isArray(fields)) {
            console.error("Could not find fields or schema array in collection object.");
            console.log("Collection keys:", Object.keys(collection));
            return;
        }

        let needsUpdate = false;

        // 1. Remove 'source' - LEAVE FOR NOW TO AVOID INDEX CONFUSION
        // const sourceIndex = fields.findIndex(f => f.name === 'source');
        // if (sourceIndex !== -1) {
        //     console.log("Removing 'source' field...");
        //     fields.splice(sourceIndex, 1);
        //     needsUpdate = true;
        // }

        // 2. Add 'type' (Select)
        // Renaming to 'kind' to see if 'type' is reserved
        if (!fields.find(f => f.name === 'kind')) {
            console.log("Adding 'kind' field...");
            const newField = {
                name: 'kind',
                type: 'select',
                required: false,
                presentable: false,
                system: false,
                options: {
                    values: ['text', 'image', 'video', 'link', 'map'],
                    maxSelect: 1
                }
            };
            fields.push(newField);
            needsUpdate = true;
            console.log("New field object:", JSON.stringify(newField, null, 2));
        }

        // 3. Add 'file' (File)
        if (!fields.find(f => f.name === 'file')) {
            // ...
            console.log("Adding 'file' field...");
            fields.push({
                name: 'file',
                type: 'file',
                required: false,
                options: {
                    maxSelect: 1,
                    maxSize: 52428800, // 50MB
                    mimeTypes: ['image/*']
                }
            });
            needsUpdate = true;
        }

        // 4. Add 'url' (URL)
        if (!fields.find(f => f.name === 'url')) {
            console.log("Adding 'url' field...");
            fields.push({
                name: 'url',
                type: 'url',
                required: false,
                options: {
                    exceptDomains: null,
                    onlyDomains: null
                }
            });
            needsUpdate = true;
        }

        if (needsUpdate) {
            console.log("Applying updates...");
            // We need to send the update in the correct format.
            // If it came from 'fields', we send 'fields'.
            const updateData = {};
            if (collection.fields) {
                updateData.fields = fields;
            } else {
                updateData.schema = fields;
            }

            await pb.collections.update(collection.id, updateData);
            console.log("Schema updated successfully!");
        } else {
            console.log("Schema is already up to date.");
        }

    } catch (e) {
        console.error("Failed to update schema:", e.message);
        if (e.response) {
            console.error("Response status:", e.response.status);
            console.error("Response data:", JSON.stringify(e.response.data, null, 2));
        }
    }
}

main();
