import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

async function main() {
    console.log(`Checking 'facts' collection fields on ${PB_URL}...`);
    const pb = new PocketBase(PB_URL);

    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
        console.log("Logged in as admin");

        const collection = await pb.collections.getOne('facts');

        // In v0.26+, schema is replaced by fields
        const fileField = collection.fields.find(f => f.name === 'file');

        if (fileField) {
            console.log("Current file field options:", JSON.stringify(fileField.options || {}, null, 2));

            // Fix if maxSize is 1 or very small
            // 5MB = 5242880
            if (!fileField.maxSelect) {
                // v0.23+ might not have maxSelect on file field but options usually has maxSize
            }

            if (fileField.maxSize === 1 || (fileField.maxSize && fileField.maxSize < 1024)) {
                console.log("Found issue: maxSize is too small. Updating to 5MB (5242880 bytes)...");
                fileField.maxSize = 5242880; // set directly on field object if v0.23+

                // Also check inside options just in case (v0.22 backward combat sometimes)
                // But v0.26 uses direct properties for some things, but let's check current value first

                await pb.collections.update('facts', {
                    fields: collection.fields
                });
                console.log("Successfully updated 'facts' collection fields.");
            } else {
                console.log(`Current maxSize is ${fileField.maxSize}. Checking if it's actually 1 byte inside options?`);
                // Sometimes it's inside options depending on field type?
                // For 'file' type, maxSize is a top-level property on the field object in v0.23+ JSON structure?
                // Let's print the whole field to be sure.
                console.log("Full field object:", JSON.stringify(fileField, null, 2));

                if (fileField.maxSize === 1) {
                    console.log("Found issue (recheck). Updating...");
                    fileField.maxSize = 5242880;
                    await pb.collections.update('facts', {
                        fields: collection.fields
                    });
                    console.log("Updated.");
                }
            }
        } else {
            console.log("No 'file' field found in 'facts' collection.");
        }

    } catch (e) {
        console.error("Error:", e.message);
        if (e.originalError) console.error("Original:", e.originalError);
    }
}

main();
